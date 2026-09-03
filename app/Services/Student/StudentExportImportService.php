<?php

namespace App\Services\Student;

use App\Enums\Constant;
use App\Models\Center;
use App\Models\ClassStudent;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Repositories\Student\StudentRepositoryInterface;
use Generator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StudentExportImportService implements StudentExportImportServiceInterface
{
    public function __construct(
        protected StudentRepositoryInterface $studentRepository
    ) {
    }

    /**
     * @return Generator<int, array<int, string>>
     * @param  ?int                               $centerId
     * @param  ?int                               $classId
     * @param  bool                               $isSuperAdmin
     */
    public function exportStudentsCsv(?int $centerId = null, ?int $classId = null, bool $isSuperAdmin = false): Generator
    {
        $headers = [
            'Mã lớp',
            'Mã học sinh',
            'Tên đăng nhập',
            'Họ',
            'Tên',
            'Họ và tên',
            'Email',
            'Số điện thoại',
            'Ngày sinh',
            'Giới tính',
            'Địa chỉ',
            'Tên phụ huynh',
            'SĐT phụ huynh',
            'Mối quan hệ phụ huynh',
            'Trạng thái',
        ];

        if ($isSuperAdmin) {
            $headers[] = 'Mã trung tâm';
        }

        yield $headers;

        foreach ($this->studentRepository->getStudentsCursor($centerId, $classId) as $student) {
            $classCodes = $student->classes ? $student->classes->pluck('code')->implode(', ') : '';

            $row = [
                $classCodes,
                (string) $student->student_code,
                (string) $student->username,
                (string) $student->first_name,
                (string) $student->last_name,
                (string) $student->full_name,
                (string) $student->email,
                (string) $student->phone,
                (string) ($student->date_of_birth ?? ''),
                (string) (Constant::GENDER_LABELS[$student->gender] ?? 'Nam'),
                (string) $student->address,
                (string) $student->parent_name,
                (string) $student->parent_phone,
                (string) (Constant::STUDENT_STATUS_LABELS[$student->status] ?? 'Đang hoạt động'),
            ];

            if ($isSuperAdmin) {
                $row[] = (string) ($student->center?->code ?? $student->center_id ?? '');
            }

            yield $row;
        }
    }

    /**
     * @return Generator<int, array<string, string>>
     * @param  string                                $filePath
     */
    public function readCsvStream(string $filePath): Generator
    {
        if (($handle = fopen($filePath, 'r')) === false) {
            return;
        }

        // Bỏ qua UTF-8 BOM nếu có
        $bom = fread($handle, 3);

        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $headerRow = fgetcsv($handle);

        if (! $headerRow) {
            fclose($handle);

            return;
        }

        $header = array_map(function (?string $col): string {
            return trim(mb_strtolower((string) $col));
        }, $headerRow);

        while (($row = fgetcsv($handle)) !== false) {
            if (empty(array_filter($row))) {
                continue;
            }

            $mapped = [];

            foreach ($header as $index => $key) {
                $mapped[$key] = isset($row[$index]) ? trim($row[$index]) : '';
            }

            yield $mapped;
        }

        fclose($handle);
    }

    /**
     * @return array{imported: int, updated: int, errors: array<int, string>}
     * @param  string                                                         $filePath
     * @param  ?int                                                           $centerId
     * @param  bool                                                           $isSuperAdmin
     */
    public function importStudentsCsv(string $filePath, ?int $centerId = null, bool $isSuperAdmin = false): array
    {
        if (! $isSuperAdmin && ! $centerId) {
            return [
                'imported' => 0,
                'updated'  => 0,
                'errors'   => ['Tài khoản quản trị chưa được gán trung tâm hợp lệ để thực hiện import.'],
            ];
        }

        $importedCount = 0;
        $updatedCount  = 0;
        $errors        = [];
        $lineIndex     = 1;
        $batch         = [];

        $processBatch = function () use (&$batch, &$importedCount, &$updatedCount) {
            if (empty($batch)) {
                return;
            }

            DB::transaction(function () use (&$batch, &$importedCount, &$updatedCount) {
                $classStudentBuffer = [];
                $now                = now();

                foreach ($batch as $item) {
                    $studentCode = $item['code'];
                    $data        = $item['data'];

                    if ($item['existing']) {
                        $this->studentRepository->updateOrCreateByCode($studentCode, $data);
                        $updatedCount++;
                        $studentObj = $this->studentRepository->findByCode($studentCode);
                    } else {
                        $data['password'] = Hash::make('12345678');
                        $studentObj       = $this->studentRepository->updateOrCreateByCode($studentCode, $data);
                        $importedCount++;
                    }

                    if (! empty($item['class_ids']) && $studentObj) {
                        $isDropped   = (int) $data['status'] === Constant::STUDENT_STATUS_DROPPED;
                        $pivotStatus = $isDropped ? Constant::CLASS_STUDENT_STATUS_LEFT : Constant::CLASS_STUDENT_STATUS_ACTIVE;
                        $leftAt      = $isDropped ? $now : null;

                        foreach ($item['class_ids'] as $classId) {
                            $classStudentBuffer[] = [
                                'class_id'    => $classId,
                                'student_id'  => $studentObj->id,
                                'status'      => $pivotStatus,
                                'enrolled_at' => $now,
                                'left_at'     => $leftAt,
                                'note'        => "Import từ CSV dòng {$item['line_index']}",
                                'created_at'  => $now,
                                'updated_at'  => $now,
                            ];
                        }
                    }
                }

                if (! empty($classStudentBuffer)) {
                    ClassStudent::upsert(
                        $classStudentBuffer,
                        ['class_id', 'student_id'],
                        ['status', 'enrolled_at', 'left_at', 'note', 'updated_at']
                    );
                }
            });

            $batch = [];
        };

        foreach ($this->readCsvStream($filePath) as $row) {
            $lineIndex++;
            $studentCode = $row['mã học sinh'] ?? $row['student_code'] ?? $row['code'] ?? '';
            $username    = $row['tên đăng nhập'] ?? $row['username'] ?? '';
            $email       = $row['email'] ?? '';
            $firstName   = $row['họ'] ?? $row['first_name'] ?? '';
            $lastName    = $row['tên'] ?? $row['last_name'] ?? '';
            $fullName    = $row['họ và tên'] ?? $row['full_name'] ?? trim("{$firstName} {$lastName}");

            if (empty($username) && empty($studentCode) && empty($email)) {
                $errors[] = "Dòng {$lineIndex}: Thiếu thông tin Mã học sinh, Tên đăng nhập hoặc Email.";

                continue;
            }

            // Xác định trung tâm cho dòng này
            $targetCenterId = $centerId;

            if ($isSuperAdmin) {
                $centerCodeOrId = $row['mã trung tâm'] ?? $row['center_code'] ?? $row['mã tt'] ?? $row['center_id'] ?? $row['trung tâm'] ?? null;

                if (! empty($centerCodeOrId)) {
                    $center = Center::where('code', $centerCodeOrId)->orWhere('id', $centerCodeOrId)->first();

                    if ($center) {
                        $targetCenterId = $center->id;
                    } else {
                        $errors[] = "Dòng {$lineIndex}: Không tìm thấy trung tâm với mã \"{$centerCodeOrId}\".";

                        continue;
                    }
                } elseif (! $targetCenterId) {
                    $errors[] = "Dòng {$lineIndex}: Thiếu thông tin Mã trung tâm.";

                    continue;
                }
            }

            if (! $targetCenterId) {
                $errors[] = "Dòng {$lineIndex}: Không xác định được trung tâm quản lý.";

                continue;
            }

            if (empty($studentCode)) {
                $studentCode = 'STD' . strtoupper(Str::random(6));
            }

            if (empty($username)) {
                $username = strtolower($studentCode);
            }

            if (empty($email)) {
                $email = strtolower($username) . '@sam-edu.local';
            }

            $existingStudent = $this->studentRepository->findByCode($studentCode)
                ?? $this->studentRepository->findByUsernameOrEmail($username);

            $dob = $row['ngày sinh'] ?? $row['date_of_birth'] ?? null;

            $data = [
                'student_code'        => $studentCode,
                'username'            => $username,
                'email'               => $email,
                'first_name'          => $firstName,
                'last_name'           => $lastName,
                'full_name'           => $fullName,
                'phone'               => $row['số điện thoại'] ?? $row['phone'] ?? null,
                'date_of_birth'       => ! empty($dob) ? $dob : null,
                'gender'              => $this->parseGender($row['giới tính'] ?? $row['gender'] ?? null),
                'address'             => $row['địa chỉ'] ?? $row['address'] ?? null,
                'parent_name'         => $row['tên phụ huynh'] ?? $row['parent_name'] ?? null,
                'parent_phone'        => $row['sđt phụ huynh'] ?? $row['parent_phone'] ?? null,
                'parent_relationship' => $row['mối quan hệ phụ huynh'] ?? $row['parent_relationship'] ?? 'bố',
                'status'              => $this->parseStatus($row['trạng thái'] ?? $row['status'] ?? null),
                'center_id'           => $targetCenterId,
            ];

            if (! $existingStudent) {
                // Kiểm tra giới hạn số học sinh (đang học + tạm nghỉ) không vượt quá max_students
                if ($targetCenterId && in_array($data['status'], [Constant::STUDENT_STATUS_ACTIVE, Constant::STUDENT_STATUS_INACTIVE], true)) {
                    $center = Center::find($targetCenterId);

                    if ($center && $center->max_students !== null) {
                        $activeAndInactiveCount = Student::where('center_id', $targetCenterId)
                            ->whereIn('status', [Constant::STUDENT_STATUS_ACTIVE, Constant::STUDENT_STATUS_INACTIVE])
                            ->count();

                        if ($activeAndInactiveCount >= $center->max_students) {
                            $errors[] = "Dòng {$lineIndex}: Không thể thêm học sinh mới do trung tâm ({$center->name}) đã đạt giới hạn tối đa ({$center->max_students}) học sinh của gói dịch vụ.";

                            continue;
                        }
                    }
                }
            }

            // Ghi danh vào lớp học nếu có cột Mã lớp trong CSV
            $classCodesRaw    = $row['mã lớp'] ?? $row['class_code'] ?? $row['mã lớp học'] ?? $row['lớp'] ?? '';
            $enrolledClassIds = [];

            if (! empty($classCodesRaw)) {
                $classCodes = array_filter(array_map('trim', explode(',', (string) $classCodesRaw)));

                if (! empty($classCodes)) {
                    $enrolledClassIds = SchoolClass::query()
                        ->whereIn('code', $classCodes)
                        ->where('center_id', $targetCenterId)
                        ->pluck('id')
                        ->map(fn ($id) => (int) $id)
                        ->toArray();
                }
            }

            $batch[] = [
                'code'       => $studentCode,
                'data'       => $data,
                'existing'   => (bool) $existingStudent,
                'class_ids'  => $enrolledClassIds,
                'line_index' => $lineIndex,
            ];

            if (count($batch) >= 1000) {
                $processBatch();
            }
        }

        if (! empty($batch)) {
            $processBatch();
        }

        return [
            'imported' => $importedCount,
            'updated'  => $updatedCount,
            'errors'   => $errors,
        ];
    }

    /**
     * @return array<int, array<int, string>>
     * @param  bool                           $isSuperAdmin
     */
    public function getSampleCsvRows(bool $isSuperAdmin = false): array
    {
        $headers = [
            'Mã lớp',
            'Mã học sinh',
            'Tên đăng nhập',
            'Họ',
            'Tên',
            'Họ và tên',
            'Email',
            'Số điện thoại',
            'Ngày sinh',
            'Giới tính',
            'Địa chỉ',
            'Tên phụ huynh',
            'SĐT phụ huynh',
            'Mối quan hệ phụ huynh',
            'Trạng thái',
        ];

        $row1 = [
            'CLS0000001',
            'STD001',
            'nguyenvana',
            'Nguyễn Văn',
            'A',
            'Nguyễn Văn A',
            'nguyenvana@gmail.com',
            '0912345678',
            '2008-05-15',
            'nam',
            '123 Đường Lê Lợi, Q1, TP.HCM',
            'Nguyễn Văn B',
            '0909876543',
            'Bố',
            'Đang hoạt động',
        ];

        $row2 = [
            'CLS0000001',
            'STD002',
            'tranthib',
            'Trần Thị',
            'B',
            'Trần Thị B',
            'tranthib@gmail.com',
            '0923456789',
            '2009-08-20',
            'nu',
            '456 Đường Nguyễn Huệ, Q1, TP.HCM',
            'Trần Văn C',
            '0908765432',
            'Mẹ',
            'Đang hoạt động',
        ];

        if ($isSuperAdmin) {
            $sampleCenterCode = Center::value('code') ?? 'CTR0000001';
            $headers[]        = 'Mã trung tâm';
            $row1[]           = $sampleCenterCode;
            $row2[]           = $sampleCenterCode;
        }

        return [
            $headers,
            $row1,
            $row2,
        ];
    }

    /**
     * Parse giá trị trạng thái học sinh từ CSV sang hằng số integer Constant::STUDENT_STATUS_*.
     * @param mixed $status
     */
    private function parseStatus(mixed $status): int
    {
        if (is_numeric($status)) {
            $val = (int) $status;

            if (in_array($val, Constant::STUDENT_STATUSES, true)) {
                return $val;
            }
        }

        $str = mb_strtolower(trim((string) $status));

        return match ($str) {
            'tạm dừng', 'tạm nghỉ', 'paused', 'inactive', 'khóa'                                   => Constant::STUDENT_STATUS_PAUSED,
            'hoàn thành', 'đã hoàn thành', 'đã tốt nghiệp', 'tốt nghiệp', 'completed', 'graduated' => Constant::STUDENT_STATUS_COMPLETED,
            'nghỉ học', 'thôi học', 'dropped', 'left'                                              => Constant::STUDENT_STATUS_DROPPED,
            default                                                                                => Constant::STUDENT_STATUS_ACTIVE,
        };
    }

    /**
     * Parse giá trị giới tính từ CSV sang hằng số integer Constant::GENDER_*.
     * @param mixed $gender
     */
    private function parseGender(mixed $gender): int
    {
        if (is_numeric($gender)) {
            $val = (int) $gender;

            if (in_array($val, Constant::GENDERS, true)) {
                return $val;
            }
        }

        $str = mb_strtolower(trim((string) $gender));

        return match ($str) {
            'nữ', 'nu', 'female', 'gái' => Constant::GENDER_FEMALE,
            'khác', 'other'             => Constant::GENDER_OTHER,
            default                     => Constant::GENDER_MALE,
        };
    }
}

<?php

namespace App\Services\Teacher;

use App\Models\Center;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Generator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TeacherExportImportService implements TeacherExportImportServiceInterface
{
    public function __construct(
        protected TeacherRepositoryInterface $teacherRepository
    ) {
    }

    /**
     * @return Generator<int, array<int, string>>
     * @param  ?int                               $centerId
     * @param  bool                               $isSuperAdmin
     */
    public function exportTeachersCsv(?int $centerId = null, bool $isSuperAdmin = false): Generator
    {
        $headers = [
            'Mã giáo viên',
            'Tên đăng nhập',
            'Họ',
            'Tên',
            'Họ và tên',
            'Email',
            'Số điện thoại',
            'Ngày sinh',
            'Giới tính',
            'Ngày vào làm',
            'Chuyên môn',
            'Ghi chú',
            'Trạng thái',
        ];

        if ($isSuperAdmin) {
            $headers[] = 'Mã trung tâm';
        }

        yield $headers;

        foreach ($this->teacherRepository->getTeachersCursor($centerId) as $teacher) {
            $row = [
                (string) $teacher->teacher_code,
                (string) $teacher->username,
                (string) $teacher->first_name,
                (string) $teacher->last_name,
                (string) $teacher->full_name,
                (string) $teacher->email,
                (string) $teacher->phone,
                (string) ($teacher->date_of_birth ?? ''),
                (string) $teacher->gender,
                (string) ($teacher->hire_date ?? ''),
                (string) $teacher->specialization,
                (string) $teacher->note,
                (string) $teacher->status,
            ];

            if ($isSuperAdmin) {
                $row[] = (string) ($teacher->center?->code ?? $teacher->center_id ?? '');
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
    public function importTeachersCsv(string $filePath, ?int $centerId = null, bool $isSuperAdmin = false): array
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
                foreach ($batch as $item) {
                    if ($item['existing']) {
                        $this->teacherRepository->updateOrCreateByCode($item['code'], $item['data']);
                        $updatedCount++;
                    } else {
                        $item['data']['password'] = Hash::make('12345678');
                        $this->teacherRepository->updateOrCreateByCode($item['code'], $item['data']);
                        $importedCount++;
                    }
                }
            });

            $batch = [];
        };

        foreach ($this->readCsvStream($filePath) as $row) {
            $lineIndex++;
            $teacherCode = $row['mã giáo viên'] ?? $row['teacher_code'] ?? $row['code'] ?? '';
            $username    = $row['tên đăng nhập'] ?? $row['username'] ?? '';
            $email       = $row['email'] ?? '';
            $firstName   = $row['họ'] ?? $row['first_name'] ?? '';
            $lastName    = $row['tên'] ?? $row['last_name'] ?? '';
            $fullName    = $row['họ và tên'] ?? $row['full_name'] ?? trim("{$firstName} {$lastName}");

            if (empty($username) && empty($teacherCode) && empty($email)) {
                $errors[] = "Dòng {$lineIndex}: Thiếu thông tin Mã giáo viên, Tên đăng nhập hoặc Email.";

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

            if (empty($teacherCode)) {
                $teacherCode = 'TCH' . strtoupper(Str::random(6));
            }

            if (empty($username)) {
                $username = strtolower($teacherCode);
            }

            if (empty($email)) {
                $email = strtolower($username) . '@sam-edu.local';
            }

            $existingTeacher = $this->teacherRepository->findByCode($teacherCode)
                ?? $this->teacherRepository->findByUsernameOrEmail($username);

            $dob      = $row['ngày sinh'] ?? $row['date_of_birth'] ?? null;
            $hireDate = $row['ngày vào làm'] ?? $row['hire_date'] ?? null;

            $data = [
                'teacher_code'   => $teacherCode,
                'username'       => $username,
                'email'          => $email,
                'first_name'     => $firstName,
                'last_name'      => $lastName,
                'full_name'      => $fullName,
                'phone'          => $row['số điện thoại'] ?? $row['phone'] ?? null,
                'date_of_birth'  => ! empty($dob) ? $dob : null,
                'gender'         => $row['giới tính'] ?? $row['gender'] ?? 'male',
                'hire_date'      => ! empty($hireDate) ? $hireDate : null,
                'specialization' => $row['chuyên môn'] ?? $row['specialization'] ?? null,
                'note'           => $row['ghi chú'] ?? $row['note'] ?? null,
                'status'         => $row['trạng thái'] ?? $row['status'] ?? 'active',
                'center_id'      => $targetCenterId,
            ];

            $batch[] = [
                'code'     => $teacherCode,
                'data'     => $data,
                'existing' => (bool) $existingTeacher,
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
            'Mã giáo viên',
            'Tên đăng nhập',
            'Họ',
            'Tên',
            'Họ và tên',
            'Email',
            'Số điện thoại',
            'Ngày sinh',
            'Giới tính',
            'Ngày vào làm',
            'Chuyên môn',
            'Ghi chú',
            'Trạng thái',
        ];

        $row1 = [
            'TCH001',
            'lethic',
            'Lê Thị',
            'C',
            'Lê Thị C',
            'lethic@gmail.com',
            '0934567890',
            '1990-03-12',
            'nu',
            '2022-01-15',
            'Tiếng Trung Sơ Cấp, Trung Cấp',
            'Giáo viên dạy giỏi',
            'active',
        ];

        $row2 = [
            'TCH002',
            'phamvand',
            'Phạm Văn',
            'D',
            'Phạm Văn D',
            'phamvand@gmail.com',
            '0945678901',
            '1988-11-25',
            'nam',
            '2021-09-01',
            'Toán 12 Nâng Cao',
            'Thạc sĩ Toán học',
            'active',
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
}

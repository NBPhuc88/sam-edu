<?php

namespace App\Services\Student;

use App\Repositories\Student\StudentRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StudentExportImportService implements StudentExportImportServiceInterface
{
    public function __construct(
        protected StudentRepositoryInterface $studentRepository
    ) {
    }

    /**
     * @return \Generator<int, array<int, string>>
     * @param  ?int                                $centerId
     * @param  ?int                                $classId
     */
    public function exportStudentsCsv(?int $centerId = null, ?int $classId = null): \Generator
    {
        // Header row
        yield [
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

        foreach ($this->studentRepository->getStudentsCursor($centerId, $classId) as $student) {
            yield [
                (string) $student->student_code,
                (string) $student->username,
                (string) $student->first_name,
                (string) $student->last_name,
                (string) $student->full_name,
                (string) $student->email,
                (string) $student->phone,
                (string) ($student->date_of_birth ?? ''),
                (string) $student->gender,
                (string) $student->address,
                (string) $student->parent_name,
                (string) $student->parent_phone,
                (string) $student->parent_relationship,
                (string) $student->status,
            ];
        }
    }

    /**
     * @return \Generator<int, array<string, string>>
     * @param  string                                 $filePath
     */
    public function readCsvStream(string $filePath): \Generator
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
     */
    public function importStudentsCsv(string $filePath, ?int $centerId = null): array
    {
        $importedCount = 0;
        $updatedCount  = 0;
        $errors        = [];
        $lineIndex     = 1;

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

            $data = [
                'student_code'        => $studentCode,
                'username'            => $username,
                'email'               => $email,
                'first_name'          => $firstName,
                'last_name'           => $lastName,
                'full_name'           => $fullName,
                'phone'               => $row['số điện thoại'] ?? $row['phone'] ?? null,
                'date_of_birth'       => ! empty($row['ngày sinh'] ?? $row['date_of_birth']) ? $row['ngày sinh'] ?? $row['date_of_birth'] : null,
                'gender'              => $row['giới tính'] ?? $row['gender'] ?? 'male',
                'address'             => $row['địa chỉ'] ?? $row['address'] ?? null,
                'parent_name'         => $row['tên phụ huynh'] ?? $row['parent_name'] ?? null,
                'parent_phone'        => $row['sđt phụ huynh'] ?? $row['parent_phone'] ?? null,
                'parent_relationship' => $row['mối quan hệ phụ huynh'] ?? $row['parent_relationship'] ?? 'bố',
                'status'              => isset($row['trạng thái']) ? (int) $row['trạng thái'] : 1,
                'center_id'           => $centerId ?? 1,
            ];

            if ($existingStudent) {
                $this->studentRepository->updateOrCreateByCode($studentCode, $data);
                $updatedCount++;
            } else {
                // Kiểm tra giới hạn số học sinh active
                if ($centerId && $data['status'] === 1) {
                    $center = \App\Models\Center::find($centerId);

                    if ($center && $center->max_students !== null) {
                        $activeCount = \App\Models\Student::where('center_id', $centerId)->where('status', 1)->count();

                        if ($activeCount >= $center->max_students) {
                            $errors[] = "Dòng {$lineIndex}: Không thể thêm học sinh mới do trung tâm đã đạt giới hạn tối đa ({$center->max_students}) học sinh của gói dịch vụ.";

                            continue;
                        }
                    }
                }

                $data['password'] = Hash::make('12345678');
                $this->studentRepository->updateOrCreateByCode($studentCode, $data);
                $importedCount++;
            }
        }

        return [
            'imported' => $importedCount,
            'updated'  => $updatedCount,
            'errors'   => $errors,
        ];
    }

    /**
     * @return array<int, array<int, string>>
     */
    public function getSampleCsvRows(): array
    {
        return [
            [
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
            ],
            [
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
                'active',
            ],
            [
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
                'active',
            ],
        ];
    }
}

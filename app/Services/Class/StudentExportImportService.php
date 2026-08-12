<?php

namespace App\Services\Class;

use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Student\StudentRepositoryInterface;
use Illuminate\Support\Str;

class StudentExportImportService implements StudentExportImportServiceInterface
{
    public function __construct(
        protected SchoolClassRepositoryInterface $schoolClassRepository,
        protected StudentRepositoryInterface $studentRepository
    ) {
    }

    /**
     * @param  int                                 $classId
     * @return \Generator<int, array<int, string>>
     */
    public function exportClassStudentsCsv(int $classId): \Generator
    {
        yield [
            'Mã học sinh',
            'Tên đăng nhập',
            'Họ và tên',
            'Email',
            'Số điện thoại',
            'Tên phụ huynh',
            'SĐT phụ huynh',
        ];

        foreach ($this->schoolClassRepository->getClassStudentsCursor($classId) as $student) {
            yield [
                (string) $student->student_code,
                (string) $student->username,
                (string) $student->full_name,
                (string) $student->email,
                (string) $student->phone,
                (string) $student->parent_name,
                (string) $student->parent_phone,
            ];
        }
    }

    /**
     * @param  string                                 $filePath
     * @return \Generator<int, array<string, string>>
     */
    public function readCsvStream(string $filePath): \Generator
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
     * @param  int                                              $classId
     * @param  string                                           $filePath
     * @return array{imported: int, errors: array<int, string>}
     */
    public function importClassStudentsCsv(int $classId, string $filePath): array
    {
        $schoolClass = $this->schoolClassRepository->findById($classId);

        if (! $schoolClass) {
            return [
                'imported' => 0,
                'errors'   => ['Không tìm thấy lớp học.'],
            ];
        }

        $importedCount = 0;
        $errors        = [];
        $lineIndex     = 1;

        foreach ($this->readCsvStream($filePath) as $row) {
            $lineIndex++;
            $studentCode = $row['mã học sinh'] ?? $row['student_code'] ?? $row['code'] ?? '';
            $username    = $row['tên đăng nhập'] ?? $row['username'] ?? '';
            $email       = $row['email'] ?? '';

            if (empty($studentCode) && empty($username) && empty($email)) {
                $errors[] = "Dòng {$lineIndex}: Thiếu thông tin Mã học sinh hoặc Username/Email.";

                continue;
            }

            $student = null;

            if (! empty($studentCode)) {
                $student = $this->studentRepository->findByCode($studentCode);
            }

            if (! $student && ! empty($username)) {
                $student = $this->studentRepository->findByUsernameOrEmail($username);
            }

            if (! $student && ! empty($email)) {
                $student = $this->studentRepository->findByUsernameOrEmail($email);
            }

            if (! $student) {
                $fullName      = $row['họ và tên'] ?? $row['full_name'] ?? 'Học sinh mới';
                $codeToUse     = ! empty($studentCode) ? $studentCode : 'STD' . strtoupper(Str::random(6));
                $usernameToUse = ! empty($username) ? $username : strtolower($codeToUse);

                $student = $this->studentRepository->updateOrCreateByCode($codeToUse, [
                    'student_code' => $codeToUse,
                    'username'     => $usernameToUse,
                    'email'        => ! empty($email) ? $email : "{$usernameToUse}@sam-edu.local",
                    'full_name'    => $fullName,
                    'first_name'   => $row['họ'] ?? $row['first_name'] ?? '',
                    'last_name'    => $row['tên'] ?? $row['last_name'] ?? $fullName,
                    'phone'        => $row['số điện thoại'] ?? $row['phone'] ?? null,
                    'parent_name'  => $row['tên phụ huynh'] ?? $row['parent_name'] ?? null,
                    'parent_phone' => $row['sđt phụ huynh'] ?? $row['parent_phone'] ?? null,
                    'center_id'    => $schoolClass->center_id,
                    'status'       => 1,
                    'password'     => bcrypt('12345678'),
                ]);
            }

            $this->schoolClassRepository->attachStudent($classId, $student->id, "Import từ CSV dòng {$lineIndex}");
            $importedCount++;
        }

        return [
            'imported' => $importedCount,
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
                'Họ và tên',
                'Email',
                'Số điện thoại',
                'Tên phụ huynh',
                'SĐT phụ huynh',
            ],
            [
                'STD001',
                'nguyenvana',
                'Nguyễn Văn A',
                'nguyenvana@gmail.com',
                '0912345678',
                'Nguyễn Văn B',
                '0909876543',
            ],
            [
                'STD002',
                'tranthib',
                'Trần Thị B',
                'tranthib@gmail.com',
                '0923456789',
                'Trần Văn C',
                '0908765432',
            ],
        ];
    }
}

<?php

use App\Models\Center;
use App\Models\Student;
use App\Services\Student\StudentExportImportService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(StudentExportImportService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test StudentCSV',
        'status' => 'active',
    ]);
});

test('exportStudentsCsv generates headers and student data rows', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_export_test',
        'first_name'   => 'Nguyen',
        'last_name'    => 'An',
        'full_name'    => 'Nguyen An',
        'student_code' => 'HS9990001',
        'email'        => 'an.export@example.com',
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $generator = $this->service->exportStudentsCsv($this->center->id);
    $rows      = iterator_to_array($generator);

    expect($rows)->not()->toBeEmpty();
    expect($rows[0][0])->toBe('Mã học sinh');
    expect($rows[1][0])->toBe('HS9990001');
});

test('importStudentsCsv creates new student from temporary CSV file', function () {
    $tmpFile = tempnam(sys_get_temp_dir(), 'std_import_') . '.csv';
    $fp      = fopen($tmpFile, 'w');
    fputcsv($fp, ['Mã học sinh', 'Tên đăng nhập', 'Họ và tên', 'Email']);
    fputcsv($fp, ['HS8880001', 'import_std_user', 'Import Student', 'import.std@example.com']);
    fclose($fp);

    $result = $this->service->importStudentsCsv($tmpFile, $this->center->id);

    unlink($tmpFile);

    expect($result['imported'])->toBe(1);
    $this->assertDatabaseHas('students', [
        'student_code' => 'HS8880001',
        'username'     => 'import_std_user',
    ]);
});

test('getSampleCsvRows returns valid header and sample rows', function () {
    $rows = $this->service->getSampleCsvRows();

    expect($rows)->toHaveCount(3);
    expect($rows[0][0])->toBe('Mã học sinh');
});

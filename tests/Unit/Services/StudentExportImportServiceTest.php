<?php

use App\Enums\Constant;
use App\Models\Center;
use App\Models\Student;
use App\Services\Student\StudentExportImportService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(StudentExportImportService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test StudentCSV',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);
});

test('exportStudentsCsv generates headers and student data rows without center column for sub admin', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_export_test',
        'first_name'   => 'Nguyen',
        'last_name'    => 'An',
        'full_name'    => 'Nguyen An',
        'student_code' => 'HS9990001',
        'email'        => 'an.export@example.com',
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $generator = $this->service->exportStudentsCsv($this->center->id, null, false);
    $rows      = iterator_to_array($generator);

    expect($rows)->not()->toBeEmpty();
    expect($rows[0][0])->toBe('Mã lớp');
    expect($rows[0][1])->toBe('Mã học sinh');
    expect($rows[0])->not()->toContain('Mã trung tâm');
    expect($rows[1][1])->toBe('HS9990001');
});

test('exportStudentsCsv includes center column for super admin', function () {
    Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'std_export_sa',
        'first_name'   => 'Pham',
        'last_name'    => 'Bao',
        'full_name'    => 'Pham Bao',
        'student_code' => 'HS9990002',
        'email'        => 'bao.export@example.com',
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $generator = $this->service->exportStudentsCsv($this->center->id, null, true);
    $rows      = iterator_to_array($generator);

    expect($rows)->not()->toBeEmpty();
    expect($rows[0])->toContain('Mã trung tâm');
    $lastIndex = count($rows[0]) - 1;
    expect($rows[1][$lastIndex])->toBe($this->center->code);
});

test('importStudentsCsv creates new student with center assigned by sub admin', function () {
    $tmpFile = tempnam(sys_get_temp_dir(), 'std_import_') . '.csv';
    $fp      = fopen($tmpFile, 'w');
    fputcsv($fp, ['Mã lớp', 'Mã học sinh', 'Tên đăng nhập', 'Họ và tên', 'Email']);
    fputcsv($fp, ['', 'HS8880001', 'import_std_user', 'Import Student', 'import.std@example.com']);
    fclose($fp);

    $result = $this->service->importStudentsCsv($tmpFile, $this->center->id, false);

    unlink($tmpFile);

    expect($result['imported'])->toBe(1);
    $this->assertDatabaseHas('students', [
        'student_code' => 'HS8880001',
        'username'     => 'import_std_user',
        'center_id'    => $this->center->id,
    ]);
});

test('importStudentsCsv by super admin resolves center from center code column', function () {
    $anotherCenter = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Another Student Center',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);

    $tmpFile = tempnam(sys_get_temp_dir(), 'std_import_sa_') . '.csv';
    $fp      = fopen($tmpFile, 'w');
    fputcsv($fp, ['Mã lớp', 'Mã học sinh', 'Tên đăng nhập', 'Họ và tên', 'Email', 'Mã trung tâm']);
    fputcsv($fp, ['', 'HS7770001', 'import_sa_std', 'SA Student', 'sa.std@example.com', $anotherCenter->code]);
    fclose($fp);

    $result = $this->service->importStudentsCsv($tmpFile, null, true);

    unlink($tmpFile);

    expect($result['imported'])->toBe(1);
    $this->assertDatabaseHas('students', [
        'student_code' => 'HS7770001',
        'center_id'    => $anotherCenter->id,
    ]);
});

test('getSampleCsvRows returns valid header and sample rows with or without center code', function () {
    $rowsSubAdmin = $this->service->getSampleCsvRows(false);
    expect($rowsSubAdmin)->toHaveCount(3);
    expect($rowsSubAdmin[0][0])->toBe('Mã lớp');
    expect($rowsSubAdmin[0][1])->toBe('Mã học sinh');
    expect($rowsSubAdmin[0])->not()->toContain('Mã trung tâm');

    $rowsSuperAdmin = $this->service->getSampleCsvRows(true);
    expect($rowsSuperAdmin)->toHaveCount(3);
    expect($rowsSuperAdmin[0])->toContain('Mã trung tâm');
});

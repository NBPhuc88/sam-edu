<?php

use App\Enums\Constant;
use App\Models\Center;
use App\Models\Teacher;
use App\Services\Teacher\TeacherExportImportService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(TeacherExportImportService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test TeacherCSV',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);
});

test('exportTeachersCsv generates headers and teacher data rows without center column for sub admin', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_export_test',
        'first_name'   => 'Tran',
        'last_name'    => 'Mai',
        'full_name'    => 'Tran Mai',
        'teacher_code' => 'GV9990001',
        'email'        => 'mai.export@example.com',
        'password'     => Hash::make('password123'),
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $generator = $this->service->exportTeachersCsv($this->center->id, false);
    $rows      = iterator_to_array($generator);

    expect($rows)->not()->toBeEmpty();
    expect($rows[0][0])->toBe('Mã giáo viên');
    expect($rows[0])->not()->toContain('Mã trung tâm');
    expect($rows[1][0])->toBe('GV9990001');
});

test('exportTeachersCsv includes center column for super admin', function () {
    Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_export_sa',
        'first_name'   => 'Le',
        'last_name'    => 'Hoa',
        'full_name'    => 'Le Hoa',
        'teacher_code' => 'GV9990002',
        'email'        => 'hoa.export@example.com',
        'password'     => Hash::make('password123'),
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $generator = $this->service->exportTeachersCsv($this->center->id, true);
    $rows      = iterator_to_array($generator);

    expect($rows)->not()->toBeEmpty();
    expect($rows[0])->toContain('Mã trung tâm');
    $lastIndex = count($rows[0]) - 1;
    expect($rows[1][$lastIndex])->toBe($this->center->code);
});

test('importTeachersCsv creates new teacher with center assigned by sub admin', function () {
    $tmpFile = tempnam(sys_get_temp_dir(), 'tch_import_') . '.csv';
    $fp      = fopen($tmpFile, 'w');
    fputcsv($fp, ['Mã giáo viên', 'Tên đăng nhập', 'Họ và tên', 'Email']);
    fputcsv($fp, ['GV8880001', 'import_tch_user', 'Import Teacher', 'import.tch@example.com']);
    fclose($fp);

    $result = $this->service->importTeachersCsv($tmpFile, $this->center->id, false);

    unlink($tmpFile);

    expect($result['imported'])->toBe(1);
    $this->assertDatabaseHas('teachers', [
        'teacher_code' => 'GV8880001',
        'username'     => 'import_tch_user',
        'center_id'    => $this->center->id,
    ]);
});

test('importTeachersCsv by super admin resolves center from center code column', function () {
    $anotherCenter = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Another Center',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);

    $tmpFile = tempnam(sys_get_temp_dir(), 'tch_import_sa_') . '.csv';
    $fp      = fopen($tmpFile, 'w');
    fputcsv($fp, ['Mã giáo viên', 'Tên đăng nhập', 'Họ và tên', 'Email', 'Mã trung tâm']);
    fputcsv($fp, ['GV7770001', 'import_sa_tch', 'SA Teacher', 'sa.tch@example.com', $anotherCenter->code]);
    fclose($fp);

    $result = $this->service->importTeachersCsv($tmpFile, null, true);

    unlink($tmpFile);

    expect($result['imported'])->toBe(1);
    $this->assertDatabaseHas('teachers', [
        'teacher_code' => 'GV7770001',
        'center_id'    => $anotherCenter->id,
    ]);
});

test('getSampleCsvRows returns valid header and sample rows with or without center code', function () {
    $rowsSubAdmin = $this->service->getSampleCsvRows(false);
    expect($rowsSubAdmin)->toHaveCount(3);
    expect($rowsSubAdmin[0][0])->toBe('Mã giáo viên');
    expect($rowsSubAdmin[0])->not()->toContain('Mã trung tâm');

    $rowsSuperAdmin = $this->service->getSampleCsvRows(true);
    expect($rowsSuperAdmin)->toHaveCount(3);
    expect($rowsSuperAdmin[0])->toContain('Mã trung tâm');
});

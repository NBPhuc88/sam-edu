<?php

use App\Models\Center;
use App\Models\Teacher;
use App\Services\Teacher\TeacherExportImportService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(TeacherExportImportService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test TeacherCSV',
        'status' => 'active',
    ]);
});

test('exportTeachersCsv generates headers and teacher data rows', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_export_test',
        'first_name'   => 'Tran',
        'last_name'    => 'Mai',
        'full_name'    => 'Tran Mai',
        'teacher_code' => 'GV9990001',
        'email'        => 'mai.export@example.com',
        'password'     => Hash::make('password123'),
        'status'       => 'active',
    ]);

    $generator = $this->service->exportTeachersCsv($this->center->id);
    $rows      = iterator_to_array($generator);

    expect($rows)->not()->toBeEmpty();
    expect($rows[0][0])->toBe('Mã giáo viên');
    expect($rows[1][0])->toBe('GV9990001');
});

test('importTeachersCsv creates new teacher from temporary CSV file', function () {
    $tmpFile = tempnam(sys_get_temp_dir(), 'tch_import_') . '.csv';
    $fp      = fopen($tmpFile, 'w');
    fputcsv($fp, ['Mã giáo viên', 'Tên đăng nhập', 'Họ và tên', 'Email']);
    fputcsv($fp, ['GV8880001', 'import_tch_user', 'Import Teacher', 'import.tch@example.com']);
    fclose($fp);

    $result = $this->service->importTeachersCsv($tmpFile, $this->center->id);

    unlink($tmpFile);

    expect($result['imported'])->toBe(1);
    $this->assertDatabaseHas('teachers', [
        'teacher_code' => 'GV8880001',
        'username'     => 'import_tch_user',
    ]);
});

test('getSampleCsvRows returns valid header and sample rows', function () {
    $rows = $this->service->getSampleCsvRows();

    expect($rows)->toHaveCount(3);
    expect($rows[0][0])->toBe('Mã giáo viên');
});

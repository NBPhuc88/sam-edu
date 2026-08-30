<?php

use App\Enums\Constant;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\Class\StudentExportImportService as ClassStudentExportImportService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(ClassStudentExportImportService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test ClassStudentCSV',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);
    $this->schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Student CSV Test',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ]);
});

test('exportClassStudentsCsv generates header and class student rows with class code', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'class_std_export',
        'first_name'   => 'Le',
        'last_name'    => 'Bao',
        'full_name'    => 'Le Bao',
        'student_code' => 'HS7770001',
        'email'        => 'bao.class@example.com',
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $this->schoolClass->students()->attach($student->id, ['enrolled_at' => now()]);

    $generator = $this->service->exportClassStudentsCsv($this->schoolClass->id);
    $rows      = iterator_to_array($generator);

    expect($rows)->not()->toBeEmpty();
    expect($rows[0][0])->toBe('Mã lớp');
    expect($rows[0][1])->toBe('Mã học sinh');
    expect($rows[1][0])->toBe($this->schoolClass->code);
    expect($rows[1][1])->toBe('HS7770001');
});

test('importClassStudentsCsv imports and attaches student to class from CSV', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'class_std_import',
        'first_name'   => 'Bui',
        'last_name'    => 'Cuong',
        'full_name'    => 'Bui Cuong',
        'student_code' => 'HS6660001',
        'password'     => Hash::make('password123'),
        'status'       => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $tmpFile = tempnam(sys_get_temp_dir(), 'class_std_import_') . '.csv';
    $fp      = fopen($tmpFile, 'w');
    fputcsv($fp, ['Mã lớp', 'Mã học sinh', 'Tên đăng nhập', 'Họ và tên']);
    fputcsv($fp, [$this->schoolClass->code, 'HS6660001', 'class_std_import', 'Bui Cuong']);
    fclose($fp);

    $result = $this->service->importClassStudentsCsv($this->schoolClass->id, $tmpFile);

    unlink($tmpFile);

    expect($result['imported'])->toBe(1);
    expect($this->schoolClass->students()->count())->toBe(1);
});

test('getSampleCsvRows returns valid header and sample rows with class code', function () {
    $rows = $this->service->getSampleCsvRows();

    expect($rows)->toHaveCount(3);
    expect($rows[0][0])->toBe('Mã lớp');
    expect($rows[0][1])->toBe('Mã học sinh');
    expect($rows[1][0])->toBe('CLS0000001');
});

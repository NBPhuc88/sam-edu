<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassSession;
use App\Models\ClassSubject;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Services\Teacher\TeacherService;

beforeEach(function () {
    $this->center  = Center::create(['code' => 'SAM', 'name' => 'Trung tâm SAM', 'status' => 1]);
    $this->admin   = Admin::create(['username' => 'super', 'full_name' => 'Super', 'password' => 'password', 'admin_code' => 'ADM1', 'role' => Constant::ROLE_SUPER_ADMIN, 'status' => 1]);
    $this->teacher = Teacher::create(['first_name' => 'A', 'last_name' => 'Nguyễn', 'center_id' => $this->center->id, 'username' => 'teacher', 'full_name' => 'Nguyễn Văn A <script>', 'password' => 'password', 'teacher_code' => 'GV0000001', 'status' => 1]);
    $class         = SchoolClass::create(['center_id' => $this->center->id, 'code' => 'C0000001', 'name' => 'IELTS K20', 'status' => 1]);
    $subject       = Subject::create(['center_id' => $this->center->id, 'code' => 'SUB1', 'name' => 'IELTS Writing']);
    $classSubject  = ClassSubject::create(['class_id' => $class->id, 'subject_id' => $subject->id, 'teacher_id' => $this->teacher->id, 'status' => Constant::CLASS_SUBJECT_STATUS_ACTIVE]);

    foreach (Constant::SESSION_STATUSES as $status) {
        ClassSession::create(['class_subject_id' => $classSubject->id, 'teacher_id' => $this->teacher->id, 'session_date' => '2026-09-0' . $status, 'start_time' => '17:30:00', 'end_time' => '19:30:00', 'status' => $status]);
    }
    ClassSession::create(['class_subject_id' => $classSubject->id, 'teacher_id' => $this->teacher->id, 'session_date' => '2026-08-31', 'start_time' => '17:30:00', 'end_time' => '19:30:00', 'status' => Constant::SESSION_STATUS_COMPLETED]);
    $this->service = app(TeacherService::class);
});

test('monthly spreadsheet has seven columns, four colored statuses and completed total only', function () {
    $html = implode('', iterator_to_array($this->service->exportTeacherSessionsExcel($this->teacher->id, 9, 2026, $this->admin)));
    expect($html)->toContain('Nguyễn Văn A &lt;script&gt;', 'IELTS K20 (C0000001)', 'IELTS Writing', '17:30 - 19:30', '03/09/2026', 'charset="UTF-8"')
        ->toContain('#D1FAE5', '#065F46', '#F3E8FF', '#6B21A8', '#FEE2E2', '#991B1B', '#FFEDD5', '#9A3412')
        ->toContain('TỔNG CỘNG (CA ĐÃ HOÀN THÀNH): 1 ca')
        ->not->toContain('Dự kiến', '01/09/2026', '31/08/2026', '<script>');
    expect(substr_count($html, '<th>'))->toBe(7);
});

test('zip includes individual spreadsheet and matching consolidated report including empty teachers', function () {
    Teacher::create(['first_name' => 'A', 'last_name' => 'Nguyễn', 'center_id' => $this->center->id, 'username' => 'empty', 'full_name' => 'Empty', 'password' => 'password', 'teacher_code' => 'GV0000002', 'status' => 1]);
    $temporaryReports = glob(sys_get_temp_dir() . '/teacher_excel_*');
    $export           = $this->service->exportAttendanceZip(9, 2026, $this->center->id, $this->admin);
    expect(glob(sys_get_temp_dir() . '/teacher_excel_*'))->toBe($temporaryReports);
    $zip = new ZipArchive();

    try {
        expect($zip->open($export['path']))->toBeTrue();
        expect($zip->numFiles)->toBe(3);
        expect($zip->getFromName('00_TongHop_ChamCong_09_2026.xls'))->toContain('Trung tâm SAM', 'TỔNG CỘNG (CA ĐÃ HOÀN THÀNH): 1 ca');
        expect($zip->getFromName('ChamCong_gv0000002_empty_09_2026.xls'))->toContain('TỔNG CỘNG (CA ĐÃ HOÀN THÀNH): 0 ca');
        expect($zip->getFromIndex(0))->toBe(implode('', iterator_to_array($this->service->exportTeacherSessionsExcel($this->teacher->id, 9, 2026, $this->admin))));
    } finally {
        $zip->close();
        unlink($export['path']);
    }
});

test('restricted administrators cannot export teachers or centers outside their assignments', function () {
    $this->admin->update(['role' => Constant::ROLE_ADMIN]);
    expect(fn () => $this->service->exportTeacherSessionsExcel($this->teacher->id, 9, 2026, $this->admin))->toThrow(\Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class);
    expect(fn () => $this->service->exportAttendanceZip(9, 2026, $this->center->id, $this->admin))->toThrow(\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException::class);
    $export = $this->service->exportAttendanceZip(9, 2026, null, $this->admin);
    $zip    = new ZipArchive();

    try {
        $zip->open($export['path']);
        expect($zip->numFiles)->toBe(1);
        expect($zip->getFromIndex(0))->not->toContain('Nguyễn Văn A');
    } finally {
        $zip->close();
        unlink($export['path']);
    }
});

test('download endpoints validate the reporting month and year', function () {
    $this->actingAs($this->admin, 'admin');
    $this->getJson(route('teachers.export-attendance-zip', ['month' => 13, 'year' => 2026]))->assertUnprocessable()->assertJsonValidationErrors('month');
    $this->getJson(route('teachers.export-sessions', ['id' => $this->teacher->id, 'month' => 9, 'year' => 'invalid']))->assertUnprocessable()->assertJsonValidationErrors('year');
});

test('download endpoints return excel and zip attachments', function () {
    $this->actingAs($this->admin, 'admin');
    $this->get(route('teachers.export-sessions', ['id' => $this->teacher->id, 'month' => 9, 'year' => 2026]))
        ->assertOk()->assertHeader('Content-Type', 'application/vnd.ms-excel; charset=UTF-8')->assertDownload('ChamCong_' . $this->teacher->id . '_9_2026.xls');
    $response = $this->get(route('teachers.export-attendance-zip', ['month' => 9, 'year' => 2026]));

    try {
        $response->assertOk()->assertDownload('ChamCong_09_2026.zip');
    } finally {
        if ($response->baseResponse instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse) {
            @unlink($response->baseResponse->getFile()->getPathname());
        }
    }
});

test('assigned center exports include its sessions and exclude other centers', function () {
    $otherCenter = Center::create(['code' => 'OTHER', 'name' => 'Other center', 'status' => 1]);
    Teacher::create(['center_id' => $otherCenter->id, 'username' => 'other', 'first_name' => 'Other', 'last_name' => 'Teacher', 'full_name' => 'Outside teacher', 'password' => 'password', 'teacher_code' => 'GV9999999', 'status' => 1]);
    $this->admin->update(['role' => Constant::ROLE_ADMIN]);
    $this->admin->centers()->attach($this->center->id);
    expect(implode('', iterator_to_array($this->service->exportTeacherSessionsExcel($this->teacher->id, 9, 2026, $this->admin))))->toContain('TỔNG CỘNG (CA ĐÃ HOÀN THÀNH): 1 ca');
    $export = $this->service->exportAttendanceZip(9, 2026, null, $this->admin);
    $zip    = new ZipArchive();

    try {
        $zip->open($export['path']);
        expect($zip->numFiles)->toBe(2);
        expect($zip->getFromName('00_TongHop_ChamCong_09_2026.xls'))->toContain('Nguyễn Văn A')->not->toContain('Outside teacher');
    } finally {
        $zip->close();
        unlink($export['path']);
    }
});

test('attendance downloads respect subscription plan features', function (string $planCode, bool $allowed) {
    $this->seed(\Database\Seeders\SubscriptionPlanSeeder::class);
    $plan = \App\Models\SubscriptionPlan::where('code', $planCode)->firstOrFail();
    $this->center->update([
        'subscription_plan_id' => $plan->id,
        'plan_type'            => $plan->plan_type,
        'expires_at'           => now()->addMonth(),
    ]);
    $this->admin->update(['role' => Constant::ROLE_ADMIN]);
    $this->admin->centers()->attach($this->center->id);
    $this->actingAs($this->admin, 'admin');

    foreach (['teachers.export-sessions', 'teachers.export-attendance-zip'] as $routeName) {
        $parameters = ['month' => 9, 'year' => 2026];

        if ($routeName === 'teachers.export-sessions') {
            $parameters['id'] = $this->teacher->id;
        }
        $response = $this->getJson(route($routeName, $parameters));

        if (! $allowed) {
            $response->assertForbidden()->assertJsonPath('code', 'PLAN_FEATURE_LOCKED')->assertJsonPath('feature', 'export_csv');
        } else {
            try {
                $response->assertOk()->assertDownload();
            } finally {
                if ($response->baseResponse instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse) {
                    @unlink($response->baseResponse->getFile()->getPathname());
                }
            }
        }
    }
})->with([
    'basic 5 classes'     => ['basic_5', false],
    'basic 20 classes'    => ['basic_20', false],
    'trial'               => ['trial', true],
    'advanced 5 classes'  => ['advanced_5', true],
    'advanced 20 classes' => ['advanced_20', true],
]);

test('excel yields its header before querying sessions and reads rows without relationship queries', function () {
    $chunks = $this->service->exportTeacherSessionsExcel($this->teacher->id, 9, 2026, $this->admin);
    expect($chunks)->toBeInstanceOf(Generator::class);
    $sessionQueries = [];
    \Illuminate\Support\Facades\DB::listen(function ($query) use (&$sessionQueries): void {
        $sessionQueries[] = $query->sql;
    });
    expect($chunks->current())->toContain('BÁO CÁO CHẤM CÔNG')->not->toContain('03/09/2026');
    expect($sessionQueries)->toBeEmpty();
    $chunks->next();
    expect($chunks->current())->toContain('02/09/2026');
    $rowCount = 0;
    while ($chunks->valid()) {
        $rowCount++;
        $chunks->next();
    }
    expect($rowCount)->toBe(5);
    expect($sessionQueries)->toHaveCount(1);
    expect($sessionQueries[0])->toContain('class_sessions');
});

test('excel HTTP response streams the report content', function () {
    $this->actingAs($this->admin, 'admin');
    $response = $this->get(route('teachers.export-sessions', ['id' => $this->teacher->id, 'month' => 9, 'year' => 2026]));
    $response->assertOk()->assertStreamed();
    expect($response->streamedContent())->toContain('03/09/2026', 'TỔNG CỘNG (CA ĐÃ HOÀN THÀNH): 1 ca')->not->toContain('Dự kiến');
});

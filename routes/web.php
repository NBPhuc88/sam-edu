<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\CenterController;
use App\Http\Controllers\CenterRegisterController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\SchoolClassStudentController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StatisticController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubscriptionPlanController;
use App\Http\Controllers\TeacherController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// ─── Public Marketing Website Routes ─────────────────────────────────────────
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/services', [HomeController::class, 'services'])->name('services');
Route::get('/about', [HomeController::class, 'about'])->name('about');
Route::get('/contact', [HomeController::class, 'contact'])->name('contact');
Route::post('/contact', [HomeController::class, 'submitContact'])->name('contact.submit');

// Real Center Onboarding Routes
Route::prefix('register-center')->name('register-center.')->group(function () {
    Route::get('/', [CenterRegisterController::class, 'showRegisterForm'])->name('index');
    Route::post('/step1', [CenterRegisterController::class, 'registerStep1'])->name('step1');
    Route::get('/check-payment/{appTransId}', [CenterRegisterController::class, 'checkPaymentStatus'])->name('check-payment');
});

// ─── Authentication Routes (Public) ──────────────────────────────────────────
Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// ─── Forgot Password & OTP Login Routes ──────────────────────────────────────
Route::get('/forgot-password', [PasswordResetController::class, 'showForgotPasswordForm'])->name('password.request');
Route::post('/forgot-password/send-otp', [PasswordResetController::class, 'sendOtp'])->name('password.send_otp');
Route::get('/verify-otp', [PasswordResetController::class, 'showVerifyOtpForm'])->name('password.verify_otp.show');
Route::post('/verify-otp', [PasswordResetController::class, 'verifyOtp'])->name('password.verify_otp');

// ─── Mandatory Password Change Route (Protected & Force Change) ─────────────
Route::get('/force-change-password', [PasswordResetController::class, 'showForceChangePasswordForm'])->name('password.force_change.show');
Route::post('/force-change-password', [PasswordResetController::class, 'updateForcedPassword'])->name('password.force_change.update');

// ─── Protected Routes (Bất kỳ guard nào: admin | center | teacher | student) ──
Route::middleware(['auth.any', 'auto.permission', 'check.plan.feature'])->group(function () {

    // Dashboard & Statistics
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/statistics', [StatisticController::class, 'index'])->name('statistics');

    // User Profile / Account Information
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ProfileController::class, 'index'])->name('index');
        Route::post('/password/send-otp', [\App\Http\Controllers\ProfileController::class, 'sendPasswordChangeOtp'])->name('password.send_otp');
        Route::post('/password/update', [\App\Http\Controllers\ProfileController::class, 'updatePassword'])->name('password.update');
        Route::post('/email/send-old-otp', [\App\Http\Controllers\ProfileController::class, 'sendChangeEmailOldOtp'])->name('email.send_old_otp');
        Route::post('/email/verify-old-otp', [\App\Http\Controllers\ProfileController::class, 'verifyChangeEmailOldOtp'])->name('email.verify_old_otp');
        Route::post('/email/send-new-otp', [\App\Http\Controllers\ProfileController::class, 'sendChangeEmailNewOtp'])->name('email.send_new_otp');
        Route::post('/email/update', [\App\Http\Controllers\ProfileController::class, 'updateEmail'])->name('email.update');
    });

    // Student Transcript & PDF Export (Phục vụ học sinh xem & in bảng điểm)
    Route::get('/student/transcript/print', [\App\Http\Controllers\StudentTranscriptController::class, 'print'])->name('student.transcript.print');

    // SaaS Upgrade Plan Page (Trang thông báo nâng cấp gói)
    Route::get('/upgrade-plan', function (\Illuminate\Http\Request $request) {
        $user   = $request->user();
        $center = null;

        if ($user instanceof \App\Models\Admin) {
            $center = $user->centers()->first();
        } elseif ($user && isset($user->center_id)) {
            $center = \App\Models\Center::find($user->center_id);
        }

        $featureKey = $request->query('feature', 'general');
        $featureDef = config("plan_features.features.{$featureKey}");

        return Inertia::render('UpgradePlan', [
            'status'       => 403,
            'reason'       => 'feature_locked',
            'title'        => 'Tính Năng Thuộc Gói Nâng Cao',
            'feature'      => $featureKey,
            'featureName'  => $featureDef['name'] ?? 'Tính Năng Nâng Cao',
            'message'      => $featureDef ? "Tính năng '{$featureDef['name']}' ({$featureDef['description']}) chỉ có trong Gói Nâng Cao. Vui lòng liên hệ Quản trị viên hệ thống để nâng cấp gói cho trung tâm của bạn." : 'Tính năng này yêu cầu nâng cấp lên gói Nâng Cao để sử dụng.',
            'currentPlan'  => $center?->subscription_plan ?? 'basic_5',
            'planType'     => $center?->plan_type ?? 'basic',
            'requiredPlan' => 'advanced',
        ]);
    })->name('upgrade-plan');

    // System Permissions Management Routes (Super Admin)
    Route::prefix('permissions')->name('permissions.')->group(function () {
        Route::get('/', [\App\Http\Controllers\PermissionController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\PermissionController::class, 'update'])->name('edit');
        Route::post('/reset', [\App\Http\Controllers\PermissionController::class, 'reset'])->name('reset');
        Route::post('/sync', [\App\Http\Controllers\PermissionController::class, 'sync'])->name('sync');
    });

    // System Settings Configuration Routes
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [SettingController::class, 'index'])->name('index');
        Route::post('/', [SettingController::class, 'update'])->name('update');
    });

    // SaaS Subscription Plans Configuration Routes (Super Admin)
    Route::prefix('plans')->name('plans.')->group(function () {
        Route::get('/', [SubscriptionPlanController::class, 'index'])->name('index');
        Route::get('/create', [SubscriptionPlanController::class, 'create'])->name('create');
        Route::post('/', [SubscriptionPlanController::class, 'store'])->name('store');
        Route::get('/{id}/edit', [SubscriptionPlanController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [SubscriptionPlanController::class, 'update'])->name('update');
        Route::delete('/{id}', [SubscriptionPlanController::class, 'destroy'])->name('destroy');
    });

    // Admin Management Routes (Super Admin)
    Route::prefix('admins')->name('admins.')->group(function () {
        Route::get('/', [AdminController::class, 'index'])->name('index');
        Route::post('/', [AdminController::class, 'store'])->name('store');
        Route::patch('/{id}', [AdminController::class, 'update'])->name('update');
        Route::delete('/{id}', [AdminController::class, 'destroy'])->name('destroy');
    });

    // Center Management Routes
    Route::prefix('centers')->name('centers.')->group(function () {
        Route::get('/', [CenterController::class, 'index'])->name('index');
        Route::get('/create', [CenterController::class, 'create'])->name('create');
        Route::post('/', [CenterController::class, 'store'])->name('store');
        Route::get('/{id}/edit', [CenterController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [CenterController::class, 'update'])->name('update');
        Route::delete('/{id}', [CenterController::class, 'destroy'])->name('destroy');
    });

    // Student Management Routes (CRUD, Export & Import)
    Route::prefix('students')->name('students.')->group(function () {
        Route::get('/', [StudentController::class, 'index'])->name('index');
        Route::get('/create', [StudentController::class, 'create'])->name('create');
        Route::post('/', [StudentController::class, 'store'])->name('store');
        Route::get('/{id}/edit', [StudentController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [StudentController::class, 'update'])->name('update');
        Route::delete('/{id}', [StudentController::class, 'destroy'])->name('destroy');
        Route::post('/{id}/assign-classes', [StudentController::class, 'assignClasses'])->name('assign-classes');
        Route::post('/bulk-assign-classes', [StudentController::class, 'bulkAssign'])->name('bulk-assign-classes');
        Route::delete('/{id}/classes/{classId}', [StudentController::class, 'removeClass'])->name('remove-class');
        Route::get('/export', [StudentController::class, 'export'])->name('export');
        Route::post('/import', [StudentController::class, 'import'])->name('import');
        Route::get('/sample-csv', [StudentController::class, 'downloadSample'])->name('sample-csv');
        Route::get('/{id}/schedule', [StudentController::class, 'schedule'])->name('schedule');
    });

    // Student Dedicated Schedule Route
    Route::get('/student/schedule', [StudentController::class, 'mySchedule'])->name('student.schedule');

    // Teacher Management Routes (CRUD, Export & Import)
    Route::prefix('teachers')->name('teachers.')->group(function () {
        Route::get('/', [TeacherController::class, 'index'])->name('index');
        Route::get('/create', [TeacherController::class, 'create'])->name('create');
        Route::post('/', [TeacherController::class, 'store'])->name('store');
        Route::get('/{id}/edit', [TeacherController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [TeacherController::class, 'update'])->name('update');
        Route::delete('/{id}', [TeacherController::class, 'destroy'])->name('destroy');
        Route::get('/export', [TeacherController::class, 'export'])->name('export');
        Route::post('/import', [TeacherController::class, 'import'])->name('import');
        Route::get('/sample-csv', [TeacherController::class, 'downloadSample'])->name('sample-csv');
        Route::get('/{id}/schedule', [TeacherController::class, 'schedule'])->name('schedule');
    });

    // Attendance Management Routes
    Route::prefix('attendance')->name('attendance.')->group(function () {
        Route::get('/', [\App\Http\Controllers\AttendanceController::class, 'index'])->name('index');
        Route::get('/session/{sessionId}', [\App\Http\Controllers\AttendanceController::class, 'show'])->name('session');
        Route::post('/session/{sessionId}', [\App\Http\Controllers\AttendanceController::class, 'save'])->name('save');
        Route::post('/session/{sessionId}/reset', [\App\Http\Controllers\AttendanceController::class, 'reset'])->name('reset');
    });

    // Subject Management Routes (Center Scope CRUD)
    Route::prefix('subjects')->name('subjects.')->group(function () {
        Route::get('/', [\App\Http\Controllers\SubjectController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\SubjectController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\SubjectController::class, 'store'])->name('store');
        Route::get('/{id}/edit', [\App\Http\Controllers\SubjectController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [\App\Http\Controllers\SubjectController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\SubjectController::class, 'destroy'])->name('destroy');
    });

    // Room Management Routes (Center Scope CRUD)
    Route::prefix('rooms')->name('rooms.')->group(function () {
        Route::get('/', [\App\Http\Controllers\RoomController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\RoomController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\RoomController::class, 'store'])->name('store');
        Route::get('/{id}/edit', [\App\Http\Controllers\RoomController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [\App\Http\Controllers\RoomController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\RoomController::class, 'destroy'])->name('destroy');
    });

    // Class Chat Groups List Route
    Route::get('/chats', [ChatController::class, 'groups'])->name('chats.index');

    // Class Management (CRUD), Class Student & Real-time Group Chat Routes
    Route::prefix('classes')->name('classes.')->group(function () {
        Route::get('/', [\App\Http\Controllers\SchoolClassController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\SchoolClassController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\SchoolClassController::class, 'store'])->name('store');
        Route::get('/{id}/edit', [\App\Http\Controllers\SchoolClassController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [\App\Http\Controllers\SchoolClassController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\SchoolClassController::class, 'destroy'])->name('destroy');
        Route::get('/{id}/schedule', [\App\Http\Controllers\SchoolClassController::class, 'schedule'])->name('schedule');

        Route::get('/students/sample-csv', [SchoolClassStudentController::class, 'downloadSample'])->name('students.sample-csv');
        Route::get('/{classId}/students', [SchoolClassStudentController::class, 'index'])->name('students.index');
        Route::get('/{classId}/students/export', [SchoolClassStudentController::class, 'export'])->name('students.export');
        Route::post('/{classId}/students/import', [SchoolClassStudentController::class, 'import'])->name('students.import');
        Route::get('/{classId}/students/available', [SchoolClassStudentController::class, 'availableStudents'])->name('students.available');
        Route::post('/{classId}/students/add', [SchoolClassStudentController::class, 'addStudents'])->name('students.add');
        Route::delete('/{classId}/students/{studentId}', [SchoolClassStudentController::class, 'removeStudent'])->name('students.remove');

        Route::get('/{classId}/exam-results', [\App\Http\Controllers\SchoolClassExamResultController::class, 'index'])->name('exam-results.index');
        Route::get('/{classId}/exam-results/export', [\App\Http\Controllers\SchoolClassExamResultController::class, 'export'])->name('exam-results.export');

        Route::prefix('{classId}/chat')->name('chat.')->group(function () {
            Route::get('/', [ChatController::class, 'index'])->name('index');
            Route::get('/messages', [ChatController::class, 'getMessages'])->name('messages');
            Route::post('/messages', [ChatController::class, 'sendMessage'])->name('send');
            Route::post('/messages/{messageId}/pin', [ChatController::class, 'togglePin'])->name('pin');
        });
    });

    // Class Schedule Management Routes (CRUD & Session Generation)
    Route::prefix('schedules')->name('schedules.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ClassScheduleController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\ClassScheduleController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\ClassScheduleController::class, 'store'])->name('store');
        Route::get('/{id}/edit', [\App\Http\Controllers\ClassScheduleController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [\App\Http\Controllers\ClassScheduleController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\ClassScheduleController::class, 'destroy'])->name('destroy');
        Route::get('/{id}/sessions', [\App\Http\Controllers\ClassScheduleController::class, 'sessions'])->name('sessions');
    });

    // Holiday Management Routes (Super Admin Only)
    Route::prefix('holidays')->name('holidays.')->group(function () {
        Route::get('/', [\App\Http\Controllers\HolidayController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\HolidayController::class, 'store'])->name('store');
        Route::post('/seed', [\App\Http\Controllers\HolidayController::class, 'seed'])->name('seed');
        Route::patch('/{id}', [\App\Http\Controllers\HolidayController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\HolidayController::class, 'destroy'])->name('destroy');
    });

    Route::get('/api/vietnam-holidays', [\App\Http\Controllers\Api\VietnamHolidayController::class, 'index'])->name('vietnam-holidays.index');

    // Class Session Management Routes (List, Detail & Reschedule/Edit)
    Route::prefix('sessions')->name('sessions.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ClassSessionController::class, 'index'])->name('index');
        Route::get('/{id}', [\App\Http\Controllers\ClassSessionController::class, 'show'])->name('show');
        Route::patch('/{id}', [\App\Http\Controllers\ClassSessionController::class, 'update'])->name('update');
    });

    // Student Tuition & Course Fee Management Routes
    Route::prefix('tuitions')->name('tuitions.')->group(function () {
        Route::get('/', [\App\Http\Controllers\StudentTuitionController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\StudentTuitionController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\StudentTuitionController::class, 'store'])->name('store');
        Route::get('/{id}', [\App\Http\Controllers\StudentTuitionController::class, 'show'])->name('show');
        Route::get('/{id}/edit', [\App\Http\Controllers\StudentTuitionController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [\App\Http\Controllers\StudentTuitionController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\StudentTuitionController::class, 'destroy'])->name('destroy');

        // Payment Installments
        Route::post('/{tuitionId}/payments', [\App\Http\Controllers\StudentTuitionController::class, 'storePayment'])->name('payments.store');
        Route::patch('/payments/{paymentId}', [\App\Http\Controllers\StudentTuitionController::class, 'updatePayment'])->name('payments.update');
        Route::delete('/payments/{paymentId}', [\App\Http\Controllers\StudentTuitionController::class, 'destroyPayment'])->name('payments.destroy');
    });

    // Student Dedicated Tuition Route
    Route::get('/student/tuitions', [\App\Http\Controllers\StudentTuitionController::class, 'myTuitions'])->name('student.tuitions.index');

    // Exam Bank Management Routes (CRUD)
    Route::prefix('exams')->name('exams.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ExamController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\ExamController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\ExamController::class, 'store'])->name('store');
        Route::get('/{id}/edit', [\App\Http\Controllers\ExamController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [\App\Http\Controllers\ExamController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\ExamController::class, 'destroy'])->name('destroy');
    });

    // Exam Types Management Routes (CRUD)
    Route::prefix('exam-types')->name('exam-types.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ExamTypeController::class, 'index'])->name('index');
        Route::get('/create', [\App\Http\Controllers\ExamTypeController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\ExamTypeController::class, 'store'])->name('store');
        Route::get('/{id}/edit', [\App\Http\Controllers\ExamTypeController::class, 'edit'])->name('edit');
        Route::patch('/{id}', [\App\Http\Controllers\ExamTypeController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\ExamTypeController::class, 'destroy'])->name('destroy');
    });

    // Class Exam Management Routes (Assign Exam to Class)
    Route::prefix('class-exams')->name('class-exams.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ClassExamController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\ClassExamController::class, 'store'])->name('store');
        Route::patch('/{id}', [\App\Http\Controllers\ClassExamController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\ClassExamController::class, 'destroy'])->name('destroy');
    });

    // Teacher & Admin Exam Grading Routes (Chấm bài thi theo lớp)
    Route::prefix('grading')->name('grading.')->group(function () {
        Route::get('/', [\App\Http\Controllers\GradingController::class, 'index'])->name('index');
        Route::get('/submissions/{id}', [\App\Http\Controllers\GradingController::class, 'show'])->name('show');
        Route::post('/submissions/{id}', [\App\Http\Controllers\GradingController::class, 'grade'])->name('grade');
    });

    // Online Exam Taking & Review Routes (Student & Teacher)
    Route::get('/exam-room', [\App\Http\Controllers\OnlineExamController::class, 'enterCode'])->name('online-exam.enter');
    Route::post('/exam-room/join', [\App\Http\Controllers\OnlineExamController::class, 'joinRoom'])->name('online-exam.join');
    Route::get('/class-exams/{id}/room', [\App\Http\Controllers\OnlineExamController::class, 'showLobby'])->name('online-exam.lobby');
    Route::post('/class-exams/{id}/start', [\App\Http\Controllers\OnlineExamController::class, 'startExam'])->name('online-exam.start');
    Route::get('/class-exams/{id}/take/{submissionId}', [\App\Http\Controllers\OnlineExamController::class, 'takeExam'])->name('online-exam.take');
    Route::post('/class-exams/{id}/autosave/{submissionId}', [\App\Http\Controllers\OnlineExamController::class, 'autoSave'])->name('online-exam.autosave');
    Route::post('/class-exams/{id}/submit/{submissionId}', [\App\Http\Controllers\OnlineExamController::class, 'submitExam'])->name('online-exam.submit');
    Route::get('/class-exams/{id}/results/{submissionId}', [\App\Http\Controllers\OnlineExamController::class, 'showResult'])->name('online-exam.result');
    Route::post('/class-exams/{id}/upload-audio', [\App\Http\Controllers\OnlineExamController::class, 'uploadAudio'])->name('online-exam.upload-audio');
    Route::get('/class-exams/audio-stream', [\App\Http\Controllers\OnlineExamController::class, 'streamAudio'])->name('online-exam.audio-stream');

    // Practice & Mock Exam Routes (Thi Thử & Luyện Tập)
    Route::get('/practice-exams', [\App\Http\Controllers\PracticeExamController::class, 'index'])->name('practice-exams.index');
    Route::get('/exams/{id}/practice', [\App\Http\Controllers\PracticeExamController::class, 'show'])->name('practice-exams.show');
    Route::post('/exams/{id}/practice-submit', [\App\Http\Controllers\PracticeExamController::class, 'submit'])->name('practice-exams.submit');

    // General Media Upload API
    Route::post('/api/uploads/media', [\App\Http\Controllers\MediaUploadController::class, 'upload'])->name('uploads.media');

    // Delete Impact Preview API
    Route::get('/api/{entity}/{id}/delete-impact', [\App\Http\Controllers\DeleteImpactController::class, 'getImpact'])->name('delete.impact');
});

// ─── Fallback Route for 404 Not Found ────────────────────────────────────────
Route::fallback(function () {
    return Inertia::render('Error', [
        'status'  => 404,
        'message' => 'Trang bạn đang tìm kiếm không tồn tại hoặc đường dẫn không đúng.',
    ]);
});

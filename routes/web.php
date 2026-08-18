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
use App\Http\Controllers\StatisticController;
use App\Http\Controllers\StudentController;
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
Route::middleware('auth.any')->group(function () {

    // Dashboard & Statistics
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/statistics', [StatisticController::class, 'index'])->name('statistics');

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
        Route::get('/export', [StudentController::class, 'export'])->name('export');
        Route::post('/import', [StudentController::class, 'import'])->name('import');
        Route::get('/sample-csv', [StudentController::class, 'downloadSample'])->name('sample-csv');
    });

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
});

// ─── Fallback Route for 404 Not Found ────────────────────────────────────────
Route::fallback(function () {
    return Inertia::render('Error', [
        'status'  => 404,
        'message' => 'Trang bạn đang tìm kiếm không tồn tại hoặc đường dẫn không đúng.',
    ]);
});

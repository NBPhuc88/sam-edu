<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\CenterController;
use App\Http\Controllers\ClassChatController;
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

// ─── Authentication Routes (Public) ──────────────────────────────────────────
Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

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

    // Student Management Routes (Export & Import)
    Route::prefix('students')->name('students.')->group(function () {
        Route::get('/', [StudentController::class, 'index'])->name('index');
        Route::get('/export', [StudentController::class, 'export'])->name('export');
        Route::post('/import', [StudentController::class, 'import'])->name('import');
        Route::get('/sample-csv', [StudentController::class, 'downloadSample'])->name('sample-csv');
    });

    // Teacher Management Routes (Export & Import)
    Route::prefix('teachers')->name('teachers.')->group(function () {
        Route::get('/', [TeacherController::class, 'index'])->name('index');
        Route::get('/export', [TeacherController::class, 'export'])->name('export');
        Route::post('/import', [TeacherController::class, 'import'])->name('import');
        Route::get('/sample-csv', [TeacherController::class, 'downloadSample'])->name('sample-csv');
    });

    // Class Student & Real-time Group Chat Routes
    Route::prefix('classes')->name('classes.')->group(function () {
        Route::get('/students/sample-csv', [SchoolClassStudentController::class, 'downloadSample'])->name('students.sample-csv');
        Route::get('/{classId}/students', [SchoolClassStudentController::class, 'index'])->name('students.index');
        Route::get('/{classId}/students/export', [SchoolClassStudentController::class, 'export'])->name('students.export');
        Route::post('/{classId}/students/import', [SchoolClassStudentController::class, 'import'])->name('students.import');

        Route::prefix('{classId}/chat')->name('chat.')->group(function () {
            Route::get('/', [ClassChatController::class, 'index'])->name('index');
            Route::get('/messages', [ClassChatController::class, 'getMessages'])->name('messages');
            Route::post('/messages', [ClassChatController::class, 'sendMessage'])->name('send');
            Route::post('/messages/{messageId}/pin', [ClassChatController::class, 'togglePin'])->name('pin');
        });
    });
});

// ─── Fallback Route for 404 Not Found ────────────────────────────────────────
Route::fallback(function () {
    return Inertia::render('Error', [
        'status'  => 404,
        'message' => 'Trang bạn đang tìm kiếm không tồn tại hoặc đường dẫn không đúng.',
    ]);
});

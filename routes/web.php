<?php

use App\Http\Controllers\Auth\LoginController;
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

// Public Marketing Website Routes
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/about', [HomeController::class, 'about'])->name('about');
Route::get('/contact', [HomeController::class, 'contact'])->name('contact');
Route::post('/contact', [HomeController::class, 'submitContact'])->name('contact.submit');

// Authentication Routes
Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// Dashboard & Statistics Routes
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::get('/statistics', [StatisticController::class, 'index'])->name('statistics');

// Student Management Routes (Export & Import)
Route::get('/students', [StudentController::class, 'index'])->name('students.index');
Route::get('/students/export', [StudentController::class, 'export'])->name('students.export');
Route::post('/students/import', [StudentController::class, 'import'])->name('students.import');
Route::get('/students/sample-csv', [StudentController::class, 'downloadSample'])->name('students.sample-csv');

// Class Student Management Routes (Export & Import)
Route::get('/classes/{classId}/students', [SchoolClassStudentController::class, 'index'])->name('classes.students.index');
Route::get('/classes/{classId}/students/export', [SchoolClassStudentController::class, 'export'])->name('classes.students.export');
Route::post('/classes/{classId}/students/import', [SchoolClassStudentController::class, 'import'])->name('classes.students.import');
Route::get('/classes/students/sample-csv', [SchoolClassStudentController::class, 'downloadSample'])->name('classes.students.sample-csv');

// Teacher Management Routes (Export & Import)
Route::get('/teachers', [TeacherController::class, 'index'])->name('teachers.index');
Route::get('/teachers/export', [TeacherController::class, 'export'])->name('teachers.export');
Route::post('/teachers/import', [TeacherController::class, 'import'])->name('teachers.import');
Route::get('/teachers/sample-csv', [TeacherController::class, 'downloadSample'])->name('teachers.sample-csv');

// Real-time Class Group Chat Routes (Redis + Reverb)
Route::get('/classes/{classId}/chat', [ClassChatController::class, 'index'])->name('classes.chat.index');
Route::get('/classes/{classId}/chat/messages', [ClassChatController::class, 'getMessages'])->name('classes.chat.messages');
Route::post('/classes/{classId}/chat/messages', [ClassChatController::class, 'sendMessage'])->name('classes.chat.send');
Route::post('/classes/{classId}/chat/messages/{messageId}/pin', [ClassChatController::class, 'togglePin'])->name('classes.chat.pin');

// Fallback Route for 404 Not Found Screen
Route::fallback(function () {
    return Inertia::render('Error', [
        'status' => 404,
        'message' => 'Trang bạn đang tìm kiếm không tồn tại hoặc đường dẫn không đúng.',
    ]);
});

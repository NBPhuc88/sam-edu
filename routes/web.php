<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\StatisticController;
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

// Fallback Route for 404 Not Found Screen
Route::fallback(function () {
    return Inertia::render('Error', [
        'status' => 404,
        'message' => 'Trang bạn đang tìm kiếm không tồn tại hoặc đường dẫn không đúng.',
    ]);
});

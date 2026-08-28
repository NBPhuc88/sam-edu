<?php

use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['web', 'throttle:60,1'])->group(function () {
    Route::get('/subscription-plans', [PaymentController::class, 'getSubscriptionPlans']);
    Route::post('/payments/request-renewal', [PaymentController::class, 'requestRenewal']);

    Route::prefix('payments/zalopay')->group(function () {
        Route::post('/create', [PaymentController::class, 'createZaloPayOrder']);
        Route::get('/status/{appTransId}', [PaymentController::class, 'checkOrderStatus']);
    });

    // Web Notifications Routes
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    });
});

Route::middleware('throttle:60,1')->prefix('payments/zalopay')->group(function () {
    Route::post('/callback', [PaymentController::class, 'handleZaloPayCallback']);
});

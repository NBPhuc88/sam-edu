<?php

use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('throttle:60,1')->group(function () {
    Route::get('/subscription-plans', [PaymentController::class, 'getSubscriptionPlans']);
    Route::post('/payments/request-renewal', [PaymentController::class, 'requestRenewal']);

    Route::prefix('payments/zalopay')->group(function () {
        Route::post('/create', [PaymentController::class, 'createZaloPayOrder']);
        Route::post('/callback', [PaymentController::class, 'handleZaloPayCallback']);
        Route::get('/status/{appTransId}', [PaymentController::class, 'checkOrderStatus']);
    });
});

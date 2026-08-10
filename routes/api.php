<?php

use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('payments/zalopay')->group(function () {
    Route::post('/create', [PaymentController::class, 'createZaloPayOrder']);
    Route::post('/callback', [PaymentController::class, 'handleZaloPayCallback']);
    Route::get('/status/{appTransId}', [PaymentController::class, 'checkOrderStatus']);
});

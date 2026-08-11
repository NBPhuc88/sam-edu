<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Online Payment & Registration Flow Feature Toggles
    |--------------------------------------------------------------------------
    |
    | Bật/tắt luồng thanh toán tự động khi đăng ký trung tâm mới.
    | - false: Đăng ký tạo trung tâm chờ kích hoạt và gửi Email Queue thông báo Admin.
    | - true: Mở cổng thanh toán ZaloPay / VietQR tự động.
    |
    */

    'enable_online_payment' => (bool) env('ENABLE_ONLINE_PAYMENT', false),

    /*
    |--------------------------------------------------------------------------
    | Active Payment Gateways
    |--------------------------------------------------------------------------
    */

    'gateways' => [
        'zalopay'       => (bool) env('ENABLE_ZALOPAY', true),
        'bank_transfer' => (bool) env('ENABLE_BANK_TRANSFER', true),
        'momo'          => (bool) env('ENABLE_MOMO', false),
        'vnpay'         => (bool) env('ENABLE_VNPAY', false),
    ],

    'bank' => [
        'bank_id'      => env('BANK_ID', 'ICB'),
        'account_no'   => env('BANK_ACCOUNT_NO', '1008889999'),
        'account_name' => env('BANK_ACCOUNT_NAME', 'CONG TY CP GIAO DUC SAM'),
    ],

];

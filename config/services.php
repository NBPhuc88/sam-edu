<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'zalopay' => [
        'app_id' => env('ZALOPAY_APP_ID', '2553'),
        'key1' => env('ZALOPAY_KEY1', 'Pc9nsE2DxTxdHzGhJuAmlAQuzIKbgWhH'),
        'key2' => env('ZALOPAY_KEY2', 'kLfiRAStA7VYuRBCExTJ8w7a8kzcIkTW'),
        'endpoint' => env('ZALOPAY_ENDPOINT', 'https://sb-openapi.zalopay.vn/v2/create'),
        'query_endpoint' => env('ZALOPAY_QUERY_ENDPOINT', 'https://sb-openapi.zalopay.vn/v2/query'),
        'callback_url' => env('ZALOPAY_CALLBACK_URL', 'http://localhost:8000/api/payments/zalopay/callback'),
    ],

];

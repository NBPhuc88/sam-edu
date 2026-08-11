<?php

use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    */

    'defaults' => [
        'guard'     => env('AUTH_GUARD', 'admin'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'admins'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    */

    'guards' => [
        'admin' => [
            'driver'   => 'session',
            'provider' => 'admins',
        ],
        'center' => [
            'driver'   => 'session',
            'provider' => 'centers',
        ],
        'teacher' => [
            'driver'   => 'session',
            'provider' => 'teachers',
        ],
        'student' => [
            'driver'   => 'session',
            'provider' => 'students',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    */

    'providers' => [
        'admins' => [
            'driver' => 'eloquent',
            'model'  => Admin::class,
        ],
        'centers' => [
            'driver' => 'eloquent',
            'model'  => \App\Models\Center::class,
        ],
        'teachers' => [
            'driver' => 'eloquent',
            'model'  => Teacher::class,
        ],
        'students' => [
            'driver' => 'eloquent',
            'model'  => Student::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    */

    'passwords' => [
        'admins' => [
            'provider' => 'admins',
            'table'    => 'password_reset_tokens',
            'expire'   => 60,
            'throttle' => 60,
        ],
        'centers' => [
            'provider' => 'centers',
            'table'    => 'password_reset_tokens',
            'expire'   => 60,
            'throttle' => 60,
        ],
        'teachers' => [
            'provider' => 'teachers',
            'table'    => 'password_reset_tokens',
            'expire'   => 60,
            'throttle' => 60,
        ],
        'students' => [
            'provider' => 'students',
            'table'    => 'password_reset_tokens',
            'expire'   => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    */

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];

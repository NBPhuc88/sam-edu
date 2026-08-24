<?php

namespace App\Enums;

// Tương thích cho import theo tên file constant.php
if (! class_exists(Constant::class)) {
    require_once __DIR__ . '/Constant.php';
}

class_alias(Constant::class, 'App\Enums\constant');

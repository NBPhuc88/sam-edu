<?php

namespace App\Enums;

enum EntityStatus: int
{
    case INACTIVE  = 0;
    case ACTIVE    = 1;
    case COMPLETED = 2;
    case CLOSED    = 3;

    public function label(): string
    {
        return match ($this) {
            self::INACTIVE  => 'Tạm dừng',
            self::ACTIVE    => 'Đang hoạt động',
            self::COMPLETED => 'Đã hoàn thành',
            self::CLOSED    => 'Đã đóng',
        };
    }
}

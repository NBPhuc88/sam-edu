<?php

namespace App\Helpers;

use Carbon\Carbon;
use Carbon\CarbonInterface;

class VietnamHolidayHelper
{
    /**
     * Danh sách ngày lễ Dương Lịch cố định hàng năm (định dạng m-d)
     *
     * @var array<string, string>
     */
    protected static array $solarHolidays = [
        '01-01' => 'Tết Dương Lịch',
        '04-30' => 'Ngày Giải Phóng Miền Nam',
        '05-01' => 'Ngày Quốc Tế Lao Động',
        '09-02' => 'Ngày Quốc Khánh',
        '09-03' => 'Nghỉ Lễ Quốc Khánh',
    ];

    /**
     * Bảng tra cứu các ngày nghỉ Tết Âm Lịch & Giỗ Tổ Hùng Vương theo Dương Lịch (2024 - 2035)
     *
     * @var array<int, array<string, string>>
     */
    protected static array $lunarHolidaysMap = [
        2024 => [
            '2024-02-08' => 'Nghỉ Tết Nguyên Đán (29 Tết)',
            '2024-02-09' => 'Nghỉ Tết Nguyên Đán (30 Tết)',
            '2024-02-10' => 'Tết Nguyên Đán (Mùng 1)',
            '2024-02-11' => 'Tết Nguyên Đán (Mùng 2)',
            '2024-02-12' => 'Tết Nguyên Đán (Mùng 3)',
            '2024-02-13' => 'Tết Nguyên Đán (Mùng 4)',
            '2024-02-14' => 'Tết Nguyên Đán (Mùng 5)',
            '2024-04-18' => 'Giỗ Tổ Hùng Vương (10/3 ÂL)',
        ],
        2025 => [
            '2025-01-27' => 'Nghỉ Tết Nguyên Đán (28 Tết)',
            '2025-01-28' => 'Nghỉ Tết Nguyên Đán (29 Tết)',
            '2025-01-29' => 'Tết Nguyên Đán (Mùng 1)',
            '2025-01-30' => 'Tết Nguyên Đán (Mùng 2)',
            '2025-01-31' => 'Tết Nguyên Đán (Mùng 3)',
            '2025-02-01' => 'Tết Nguyên Đán (Mùng 4)',
            '2025-02-02' => 'Tết Nguyên Đán (Mùng 5)',
            '2025-04-07' => 'Giỗ Tổ Hùng Vương (10/3 ÂL)',
        ],
        2026 => [
            '2026-02-15' => 'Nghỉ Tết Nguyên Đán (28 Tết)',
            '2026-02-16' => 'Nghỉ Tết Nguyên Đán (29 Tết)',
            '2026-02-17' => 'Tết Nguyên Đán (Mùng 1)',
            '2026-02-18' => 'Tết Nguyên Đán (Mùng 2)',
            '2026-02-19' => 'Tết Nguyên Đán (Mùng 3)',
            '2026-02-20' => 'Tết Nguyên Đán (Mùng 4)',
            '2026-02-21' => 'Tết Nguyên Đán (Mùng 5)',
            '2026-02-22' => 'Tết Nguyên Đán (Mùng 6)',
            '2026-04-26' => 'Giỗ Tổ Hùng Vương (10/3 ÂL)',
        ],
        2027 => [
            '2027-02-05' => 'Nghỉ Tết Nguyên Đán (29 Tết)',
            '2027-02-06' => 'Tết Nguyên Đán (Mùng 1)',
            '2027-02-07' => 'Tết Nguyên Đán (Mùng 2)',
            '2027-02-08' => 'Tết Nguyên Đán (Mùng 3)',
            '2027-02-09' => 'Tết Nguyên Đán (Mùng 4)',
            '2027-02-10' => 'Tết Nguyên Đán (Mùng 5)',
            '2027-02-11' => 'Tết Nguyên Đán (Mùng 6)',
            '2027-04-16' => 'Giỗ Tổ Hùng Vương (10/3 ÂL)',
        ],
        2028 => [
            '2028-01-25' => 'Nghỉ Tết Nguyên Đán (29 Tết)',
            '2028-01-26' => 'Tết Nguyên Đán (Mùng 1)',
            '2028-01-27' => 'Tết Nguyên Đán (Mùng 2)',
            '2028-01-28' => 'Tết Nguyên Đán (Mùng 3)',
            '2028-01-29' => 'Tết Nguyên Đán (Mùng 4)',
            '2028-01-30' => 'Tết Nguyên Đán (Mùng 5)',
            '2028-04-04' => 'Giỗ Tổ Hùng Vương (10/3 ÂL)',
        ],
        2029 => [
            '2029-02-12' => 'Nghỉ Tết Nguyên Đán (29 Tết)',
            '2029-02-13' => 'Tết Nguyên Đán (Mùng 1)',
            '2029-02-14' => 'Tết Nguyên Đán (Mùng 2)',
            '2029-02-15' => 'Tết Nguyên Đán (Mùng 3)',
            '2029-02-16' => 'Tết Nguyên Đán (Mùng 4)',
            '2029-02-17' => 'Tết Nguyên Đán (Mùng 5)',
            '2029-04-23' => 'Giỗ Tổ Hùng Vương (10/3 ÂL)',
        ],
        2030 => [
            '2030-02-02' => 'Nghỉ Tết Nguyên Đán (29 Tết)',
            '2030-02-03' => 'Tết Nguyên Đán (Mùng 1)',
            '2030-02-04' => 'Tết Nguyên Đán (Mùng 2)',
            '2030-02-05' => 'Tết Nguyên Đán (Mùng 3)',
            '2030-02-06' => 'Tết Nguyên Đán (Mùng 4)',
            '2030-02-07' => 'Tết Nguyên Đán (Mùng 5)',
            '2030-04-12' => 'Giỗ Tổ Hùng Vương (10/3 ÂL)',
        ],
    ];

    /**
     * Kiểm tra một ngày có phải ngày lễ của Việt Nam hay không
     * @param CarbonInterface|string $date
     */
    public static function isHoliday(CarbonInterface|string $date): bool
    {
        return self::getHolidayName($date) !== null;
    }

    /**
     * Lấy tên ngày lễ của Việt Nam nếu có
     * @param CarbonInterface|string $date
     */
    public static function getHolidayName(CarbonInterface|string $date): ?string
    {
        $carbon = is_string($date) ? Carbon::parse($date) : $date;
        $ymd    = $carbon->format('Y-m-d');
        $md     = $carbon->format('m-d');
        $year   = (int) $carbon->format('Y');

        // 1. Kiểm tra ngày lễ Dương Lịch
        if (isset(self::$solarHolidays[$md])) {
            return self::$solarHolidays[$md];
        }

        // 2. Kiểm tra ngày lễ Âm Lịch (Tết & Giỗ Tổ)
        if (isset(self::$lunarHolidaysMap[$year][$ymd])) {
            return self::$lunarHolidaysMap[$year][$ymd];
        }

        return null;
    }
}

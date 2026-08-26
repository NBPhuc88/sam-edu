<?php

namespace App\Helpers;

use Illuminate\Support\Str;

class SeoHelper
{
    /**
     * Tạo slug tiếng Việt không dấu chuẩn SEO.
     * @param string $title
     */
    public static function slug(string $title): string
    {
        return Str::slug($title, '-');
    }

    /**
     * Lấy URL Canonical tuyệt đối cho một đường dẫn.
     * @param ?string $path
     */
    public static function canonicalUrl(?string $path = null): string
    {
        $baseUrl = config('app.url', 'https://www.samedu.io.vn');
        $path    = $path ? '/' . ltrim($path, '/') : '';

        return rtrim($baseUrl, '/') . $path;
    }

    /**
     * Định dạng tiêu đề trang với Tên Thương hiệu.
     * @param string $title
     * @param string $brandName
     */
    public static function formatTitle(string $title, string $brandName = 'SAM EDU'): string
    {
        if (str_contains($title, $brandName)) {
            return $title;
        }

        return "{$title} | {$brandName} - Hệ Thống Quản Lý Giáo Dục";
    }

    /**
     * Tối ưu hóa chuỗi mô tả Meta (cắt ngắn 160 ký tự, loại bỏ thẻ HTML).
     * @param string $text
     * @param int    $limit
     */
    public static function cleanMetaText(string $text, int $limit = 160): string
    {
        $clean = strip_tags($text);
        $clean = (string) preg_replace('/\s+/', ' ', $clean);
        $clean = trim($clean);

        return Str::limit($clean, $limit);
    }
}

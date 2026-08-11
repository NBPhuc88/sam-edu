<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

        <!-- Default SEO & OpenGraph Meta Tags -->
        <meta name="description" content="Giải Pháp Quản Lý Giáo Dục Đa Trung Tâm hàng đầu. Tối ưu hóa quản lý học sinh, điểm danh thông minh, sắp xếp lịch học và tự động gia hạn qua ZaloPay QR Code.">
        <meta name="keywords" content="Giải Pháp Quản Lý Giáo Dục, phần mềm quản lý trung tâm, quản lý học sinh, phần mềm giáo dục, điểm danh thông minh, Giáo dục Sam, Sam Edu, gia hạn ZaloPay">
        <meta name="author" content="Công ty Cổ phần Giáo dục Sam">

        <!-- Open Graph / Facebook / Zalo -->
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="Hệ thống Quản lý Giáo dục Sam">
        <meta property="og:title" content="Giải Pháp Quản Lý Giáo Dục Đa Trung Tâm - Giáo Dục Sam">
        <meta property="og:description" content="Giải pháp quản lý giáo dục tối ưu cho trung tâm đào tạo: quản lý học sinh, điểm danh thông minh, tự động hóa thanh toán ZaloPay.">
        <meta property="og:url" content="{{ config('app.url') }}">
        <meta property="og:locale" content="vi_VN">

        <!-- Favicons -->
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Giáo Dục Sam') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>

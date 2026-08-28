<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        @php
            $seoData = $page['props']['seo'] ?? null;
            $seoTitle = !empty($seoData['title']) ? $seoData['title'] : 'SAM EDU - Hệ Thống Quản Lý Trung Tâm Giáo Dục';
            $seoDescription = !empty($seoData['description']) ? $seoData['description'] : 'Giải Pháp Quản Lý Trung Tâm Giáo Dục đột phá: Tối ưu hóa quy trình quản lý học sinh, điểm danh thông minh, khảo thí 9 dạng câu hỏi và quản lý học phí.';
            $rawOgImage = $seoData['og_image'] ?? null;
            $seoOgImage = (!empty($rawOgImage) && !str_starts_with($rawOgImage, 'blob:')) ? $rawOgImage : asset('og-banner.png');
            $seoCanonical = !empty($seoData['canonical_url']) ? $seoData['canonical_url'] : url()->current();
        @endphp

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#0284c7">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

        <!-- DNS Preconnect for Performance -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

        <!-- Favicons -->
        <link rel="shortcut icon" href="{{ asset('favicon.ico') }}?v=2">
        <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}?v=2">
        <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon.png') }}?v=2">
        <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png') }}?v=2">

        <!-- Facebook Open Graph Meta Tags (Dynamic from Admin Settings & Inertia Props) -->
        <meta property="og:title" content="{{ $seoTitle }}">
        <meta property="og:description" content="{{ $seoDescription }}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ $seoCanonical }}">
        <meta property="og:image" content="{{ $seoOgImage }}">
        <meta property="og:image:secure_url" content="{{ $seoOgImage }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:site_name" content="SAM EDU">

        <!-- Twitter Card Meta Tags (Dynamic) -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $seoTitle }}">
        <meta name="twitter:description" content="{{ $seoDescription }}">
        <meta name="twitter:image" content="{{ $seoOgImage }}">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'SAM Digital - Hệ thống Quản lý Trung Tâm Giáo Dục') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>

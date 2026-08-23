<?php

namespace App\Services\Setting;

interface SettingServiceInterface
{
    /**
     * @return array{
     *     settings: array<string, string|null>,
     *     seo: \Illuminate\Database\Eloquent\Collection<int, \App\Models\SeoMetadata>
     * }
     */
    public function getSettingsData(): array;

    /**
     * @param array<string, mixed>                $settingsData
     * @param array<string, array<string, mixed>> $seoData
     */
    public function updateSettings(array $settingsData, array $seoData = []): void;
}

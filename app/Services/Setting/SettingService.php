<?php

namespace App\Services\Setting;

use App\Repositories\Setting\SeoMetadataRepositoryInterface;
use App\Repositories\Setting\SystemSettingRepositoryInterface;
use Illuminate\Support\Facades\DB;

class SettingService implements SettingServiceInterface
{
    public function __construct(
        protected SystemSettingRepositoryInterface $systemSettingRepository,
        protected SeoMetadataRepositoryInterface $seoMetadataRepository
    ) {
    }

    /**
     * @return array{
     *     settings: array<string, string|null>,
     *     seo: \Illuminate\Database\Eloquent\Collection<int, \App\Models\SeoMetadata>
     * }
     */
    public function getSettingsData(): array
    {
        return [
            'settings' => $this->systemSettingRepository->getAllAsKeyValue(),
            'seo'      => $this->seoMetadataRepository->getAll(),
        ];
    }

    /**
     * @param array<string, mixed>                $settingsData
     * @param array<string, array<string, mixed>> $seoData
     */
    public function updateSettings(array $settingsData, array $seoData = []): void
    {
        DB::transaction(function () use ($settingsData, $seoData) {
            foreach ($settingsData as $key => $value) {
                $this->systemSettingRepository->setByKey((string) $key, (string) ($value ?? ''));
            }

            foreach ($seoData as $routeName => $data) {
                if (is_array($data) && ! empty($routeName)) {
                    $this->seoMetadataRepository->updateOrCreate((string) $routeName, [
                        'title'         => $data['title'] ?? '',
                        'description'   => $data['description'] ?? null,
                        'keywords'      => $data['keywords'] ?? null,
                        'og_image'      => $data['og_image'] ?? null,
                        'canonical_url' => $data['canonical_url'] ?? null,
                    ]);
                }
            }
        });
    }
}

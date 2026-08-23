<?php

namespace App\Repositories\Setting;

use App\Models\SeoMetadata;
use Illuminate\Database\Eloquent\Collection;

interface SeoMetadataRepositoryInterface
{
    /**
     * @return Collection<int, SeoMetadata>
     */
    public function getAll(): Collection;

    public function getByRouteName(?string $routeName): ?SeoMetadata;

    /**
     * @param array<string, mixed> $data
     * @param string               $routeName
     */
    public function updateOrCreate(string $routeName, array $data): SeoMetadata;
}

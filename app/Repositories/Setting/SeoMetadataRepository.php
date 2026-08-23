<?php

namespace App\Repositories\Setting;

use App\Models\SeoMetadata;
use Illuminate\Database\Eloquent\Collection;

class SeoMetadataRepository implements SeoMetadataRepositoryInterface
{
    /**
     * @return Collection<int, SeoMetadata>
     */
    public function getAll(): Collection
    {
        return SeoMetadata::all();
    }

    public function getByRouteName(?string $routeName): ?SeoMetadata
    {
        if (! $routeName) {
            return null;
        }

        return SeoMetadata::where('route_name', $routeName)->first();
    }

    /**
     * @param array<string, mixed> $data
     * @param string               $routeName
     */
    public function updateOrCreate(string $routeName, array $data): SeoMetadata
    {
        return SeoMetadata::updateOrCreate(
            ['route_name' => $routeName],
            $data
        );
    }
}

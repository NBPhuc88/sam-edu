<?php

namespace App\Services\Impact;

interface DeleteImpactServiceInterface
{
    /**
     * Get impact summary before deleting an entity.
     *
     * @param  string               $entity
     * @param  int                  $id
     * @return array<string, mixed>
     */
    public function getImpact(string $entity, int $id): array;
}

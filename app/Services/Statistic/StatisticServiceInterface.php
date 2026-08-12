<?php

namespace App\Services\Statistic;

interface StatisticServiceInterface
{
    /**
     * @param  ?int                 $selectedCenterId
     * @return array<string, mixed>
     */
    public function getStatisticData(?int $selectedCenterId = null): array;
}

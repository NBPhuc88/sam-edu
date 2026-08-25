<?php

namespace App\Services\Statistic;

use App\Enums\Constant;

interface StatisticServiceInterface
{
    /**
     * @param  ?int                 $selectedCenterId
     * @param  int                  $perPage
     * @param  int                  $page
     * @return array<string, mixed>
     */
    public function getStatisticData(
        ?int $selectedCenterId = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
    ): array;
}

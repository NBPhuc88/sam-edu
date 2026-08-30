<?php

namespace App\Services\Statistic;

use App\Enums\Constant;

interface StatisticServiceInterface
{
    /**
     * @param  ?int                 $selectedCenterId
     * @param  ?string              $month
     * @param  ?int                 $subjectId
     * @param  int                  $perPage
     * @param  int                  $page
     * @return array<string, mixed>
     */
    public function getStatisticData(
        ?int $selectedCenterId = null,
        ?string $month = null,
        ?int $subjectId = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
    ): array;
}

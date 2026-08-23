<?php

namespace App\Services\Dashboard;

interface DashboardServiceInterface
{
    /**
     * @param  ?string              $month
     * @return array<string, mixed>
     */
    public function getDashboardData(?string $month = null): array;
}

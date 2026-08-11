<?php

namespace App\Services\Dashboard;

interface DashboardServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function getDashboardData(): array;
}

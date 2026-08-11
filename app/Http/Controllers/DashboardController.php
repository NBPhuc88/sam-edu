<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\DashboardServiceInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardServiceInterface $dashboardService
    ) {
    }

    /**
     * Display the main dashboard based on authenticated role.
     * @param Request $request
     */
    public function index(Request $request): Response
    {
        $data = $this->dashboardService->getDashboardData();

        return Inertia::render('Dashboard', $data);
    }
}

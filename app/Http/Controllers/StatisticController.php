<?php

namespace App\Http\Controllers;

use App\Enums\Constant;
use App\Http\Requests\Statistic\FilterStatisticRequest;
use App\Services\Statistic\StatisticServiceInterface;
use Inertia\Inertia;
use Inertia\Response;

class StatisticController extends Controller
{
    public function __construct(
        protected StatisticServiceInterface $statisticService
    ) {
    }

    /**
     * Display role-scoped student statistics page (by Center & by Class).
     * @param FilterStatisticRequest $request
     */
    public function index(FilterStatisticRequest $request): Response
    {
        $selectedCenterId = $request->query('center_id') ? (int) $request->query('center_id') : null;
        $perPage          = (int) ($request->query('per_page') ?: Constant::DEFAULT_PER_PAGE);
        $page             = (int) ($request->query('page') ?: Constant::DEFAULT_PAGE);

        $data = $this->statisticService->getStatisticData($selectedCenterId, $perPage, $page);

        if (! empty($data['forbidden'])) {
            return Inertia::render('Error', [
                'status'  => 403,
                'message' => $data['message'] ?? 'Bạn không có quyền truy cập vào trang thống kê báo cáo quản trị.',
            ]);
        }

        return Inertia::render('Admin/Statistics', $data);
    }
}

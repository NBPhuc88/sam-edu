<?php

namespace App\Http\Controllers;

use App\Services\Subscription\UpgradePlanServiceInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UpgradePlanController extends Controller
{
    public function __construct(
        protected UpgradePlanServiceInterface $upgradePlanService
    ) {
    }

    /**
     * Hiển thị trang thông báo nâng cấp gói dịch vụ.
     *
     * @param  Request  $request
     * @return Response
     */
    public function index(Request $request): Response
    {
        $featureKey = $request->query('feature');
        $feature    = is_string($featureKey) ? $featureKey : null;

        $data = $this->upgradePlanService->getUpgradePlanData(
            $request->user(),
            $feature
        );

        return Inertia::render('UpgradePlan', $data);
    }
}

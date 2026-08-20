<?php

namespace App\Http\Controllers\Api;

use App\Helpers\VietnamHolidayHelper;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class VietnamHolidayController extends Controller
{
    /**
     * @param  Request      $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $year = (int) ($request->input('year') ?: now()->year);

        if ($year < 2020 || $year > 2050) {
            $year = (int) now()->year;
        }

        $holidays = Cache::remember("vietnam_holidays_{$year}", 86400, function () use ($year) {
            return VietnamHolidayHelper::getHolidaysForYear($year);
        });

        return response()->json([
            'year'     => $year,
            'holidays' => $holidays,
        ]);
    }
}

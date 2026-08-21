<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Holiday\HolidayServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VietnamHolidayController extends Controller
{
    public function __construct(
        protected HolidayServiceInterface $holidayService
    ) {
    }

    /**
     * @param  Request      $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $holidays = $this->holidayService->getAll();

        $formatted = $holidays->map(fn($h) => [
            'id'           => $h->id,
            'name'         => $h->name,
            'date'         => $h->date instanceof \DateTimeInterface ? $h->date->format('Y-m-d') : (string) $h->date,
            'is_lunar'     => (bool) $h->is_lunar,
            'is_recurring' => (bool) $h->is_recurring,
            'reason'       => $h->name,
        ])->values();

        return response()->json([
            'holidays' => $formatted,
        ]);
    }
}

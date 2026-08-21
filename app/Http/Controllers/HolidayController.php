<?php

namespace App\Http\Controllers;

use App\Http\Requests\Holiday\StoreHolidayRequest;
use App\Http\Requests\Holiday\UpdateHolidayRequest;
use App\Services\Holiday\HolidayServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function __construct(
        protected HolidayServiceInterface $holidayService
    ) {
    }

    /**
     * @param  Request  $request
     * @return Response
     */
    public function index(Request $request): Response
    {
        $admin  = auth('admin')->user();
        $year   = $request->filled('year') ? (int) $request->input('year') : (int) now()->year;
        $search = $request->input('search');

        $holidays       = $this->holidayService->getPaginatedHolidays($year, $search, 20, (int) $request->input('page', 1), $admin);
        $availableYears = $this->holidayService->getAvailableYears();

        return Inertia::render('Admin/Holidays/Index', [
            'holidays'       => $holidays,
            'selectedYear'   => $year,
            'availableYears' => $availableYears,
            'filters'        => [
                'year'   => $year,
                'search' => $search,
            ],
        ]);
    }

    /**
     * @param  StoreHolidayRequest $request
     * @return RedirectResponse
     */
    public function store(StoreHolidayRequest $request): RedirectResponse
    {
        $admin = auth('admin')->user();
        $this->holidayService->createHoliday($request->validated(), $admin);

        return redirect()->back()->with('success', 'Đã thêm ngày lễ mới thành công! Hệ thống đang tự động cập nhật lịch học các lớp liên quan.');
    }

    /**
     * @param  UpdateHolidayRequest $request
     * @param  int                  $id
     * @return RedirectResponse
     */
    public function update(UpdateHolidayRequest $request, int $id): RedirectResponse
    {
        $admin = auth('admin')->user();
        $this->holidayService->updateHoliday($id, $request->validated(), $admin);

        return redirect()->back()->with('success', 'Đã cập nhật ngày lễ thành công! Hệ thống đang tự động đồng bộ lại lịch học các lớp.');
    }

    /**
     * @param  int              $id
     * @return RedirectResponse
     */
    public function destroy(int $id): RedirectResponse
    {
        $admin = auth('admin')->user();
        $this->holidayService->deleteHoliday($id, $admin);

        return redirect()->back()->with('success', 'Đã xóa ngày lễ thành công! Hệ thống đang tự động cập nhật lịch học các lớp.');
    }

    /**
     * @param  Request          $request
     * @return RedirectResponse
     */
    public function seed(Request $request): RedirectResponse
    {
        $admin = auth('admin')->user();
        $year  = (int) ($request->input('year') ?: now()->year);

        $count = $this->holidayService->seedDefaultHolidaysForYear($year, $admin, true);

        if ($count > 0) {
            return redirect()->back()->with('success', "Đã nạp thành công {$count} ngày lễ mặc định cho năm {$year}!");
        }

        return redirect()->back()->with('info', "Năm {$year} đã có đầy đủ danh sách ngày lễ.");
    }
}

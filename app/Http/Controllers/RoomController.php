<?php

namespace App\Http\Controllers;

use App\Http\Requests\Room\FilterRoomRequest;
use App\Http\Requests\Room\StoreRoomRequest;
use App\Http\Requests\Room\UpdateRoomRequest;
use App\Models\Admin;
use App\Services\Room\RoomServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class RoomController extends Controller
{
    public function __construct(
        protected RoomServiceInterface $roomService
    ) {
    }

    protected function getAuthAdmin(): ?Admin
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }

    public function index(FilterRoomRequest $request): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $search   = $request->input('search');
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $status   = $request->input('status');
        $page     = $request->integer('page', 1);
        $perPage  = $request->integer('per_page', config('app.pagination_per_page', 20));

        $rooms = $this->roomService->getPaginatedRooms(
            is_string($search) ? $search : null,
            $centerId,
            is_string($status) ? $status : null,
            $perPage,
            $page,
            $admin
        );

        $formData = $this->roomService->getFormData($admin);
        $stats    = $this->roomService->getStats($admin);

        return Inertia::render('Admin/Rooms/Index', [
            'rooms'   => $rooms,
            'centers' => $formData['centers'],
            'stats'   => $stats,
            'filters' => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
                'status'    => $status ?? '',
                'per_page'  => $perPage,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $formData = $this->roomService->getFormData($admin);

        return Inertia::render('Admin/Rooms/Create', [
            'centers' => $formData['centers'],
        ]);
    }

    public function store(StoreRoomRequest $request): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $room  = $this->roomService->createRoom($request->validated(), $admin);

        return redirect()->route('rooms.index')
            ->with('success', "Thêm phòng học '{$room->name}' thành công!");
    }

    public function edit(int $id): InertiaResponse
    {
        $admin    = $this->getAuthAdmin();
        $room     = $this->roomService->getRoomById($id, $admin);
        $formData = $this->roomService->getFormData($admin);

        return Inertia::render('Admin/Rooms/Edit', [
            'room'    => $room,
            'centers' => $formData['centers'],
        ]);
    }

    public function update(UpdateRoomRequest $request, int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $room  = $this->roomService->updateRoom($id, $request->validated(), $admin);

        return redirect()->route('rooms.index')
            ->with('success', "Cập nhật phòng học '{$room->name}' thành công!");
    }

    public function destroy(int $id): RedirectResponse
    {
        $admin = $this->getAuthAdmin();
        $this->roomService->deleteRoom($id, $admin);

        return redirect()->route('rooms.index')
            ->with('success', 'Xóa phòng học thành công!');
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\GameRoom\{StoreGameRoomRequest, JoinGameRoomRequest, AnswerGameRoomRequest, ReactGameRoomRequest};
use App\Models\{Admin, Teacher, Student, GameRoom};
use App\Services\GameRoom\GameRoomServiceInterface;
use Illuminate\Http\{JsonResponse, RedirectResponse, Request};
use Illuminate\Support\Facades\Auth;
use Inertia\{Inertia, Response};

class GameRoomController extends Controller
{
    public function __construct(protected GameRoomServiceInterface $service)
    {
    }
    private function actor(): Admin|Teacher|Student
    {
        $user = Auth::guard('admin')->user() ?? Auth::guard('teacher')->user() ?? Auth::guard('student')->user();
        abort_unless($user instanceof Admin || $user instanceof Teacher || $user instanceof Student, 401);

        return $user;
    }
    public function index(Request $request): Response
    {
        return Inertia::render('GameRooms/Index', $this->service->indexData($this->actor(), $request->all()));
    }
    public function create(): Response
    {
        return Inertia::render('GameRooms/Create', $this->service->createData($this->actor()));
    }
    public function store(StoreGameRoomRequest $request): RedirectResponse
    {
        $room = $this->service->create($request->validated(), $this->actor());

        return redirect()->route('game-rooms.show', $room);
    }
    public function join(JoinGameRoomRequest $request): RedirectResponse
    {
        $room = $this->service->join($request->validated('pin'), $this->actor());

        return redirect()->route('game-rooms.show', $room);
    }
    public function show(GameRoom $gameRoom): Response
    {
        return Inertia::render('GameRooms/Arena', ['initialRoom' => $this->service->sync($gameRoom, $this->actor())]);
    }
    public function sync(GameRoom $gameRoom): JsonResponse
    {
        return response()->json($this->service->sync($gameRoom, $this->actor()));
    }
    public function start(GameRoom $gameRoom): JsonResponse
    {
        $this->service->start($gameRoom, $this->actor());

        return $this->sync($gameRoom);
    }
    public function cancel(GameRoom $gameRoom): JsonResponse
    {
        $this->service->cancel($gameRoom, $this->actor());

        return $this->sync($gameRoom);
    }
    public function answer(AnswerGameRoomRequest $request, GameRoom $gameRoom): JsonResponse
    {
        $this->service->answer($gameRoom, $request->validated(), $this->actor());

        return $this->sync($gameRoom);
    }
    public function react(ReactGameRoomRequest $request, GameRoom $gameRoom): JsonResponse
    {
        $this->service->react($gameRoom, $request->validated('emoji'), $this->actor());

        return response()->json(['success' => true]);
    }
}

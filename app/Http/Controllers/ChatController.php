<?php

namespace App\Http\Controllers;

use App\Http\Requests\Chat\SendClassChatMessageRequest;
use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\Chat\ChatServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ChatController extends Controller
{
    public function __construct(
        protected ChatServiceInterface $chatService
    ) {
    }

    public function index(Request $request, int $classId): InertiaResponse
    {
        $schoolClass   = $this->chatService->getClassWithCenter($classId);
        $currentUser   = $this->getCurrentUserSenderInfo();
        $messages      = $this->chatService->getRecentMessages($classId);
        $pinnedMessage = $this->chatService->getPinnedMessage($classId);

        return Inertia::render('Admin/Classes/Chat', [
            'schoolClass'          => $schoolClass,
            'currentUser'          => $currentUser,
            'initialMessages'      => $messages,
            'initialPinnedMessage' => $pinnedMessage,
        ]);
    }

    public function getMessages(int $classId): JsonResponse
    {
        $messages      = $this->chatService->getRecentMessages($classId);
        $pinnedMessage = $this->chatService->getPinnedMessage($classId);

        return response()->json([
            'messages'       => $messages,
            'pinned_message' => $pinnedMessage,
        ]);
    }

    public function sendMessage(SendClassChatMessageRequest $request, int $classId): JsonResponse
    {
        $schoolClass = $this->chatService->getClassWithCenter($classId);
        $senderInfo  = $this->getCurrentUserSenderInfo();
        $messageText = (string) $request->input('message');

        $sentMessage = $this->chatService->sendMessage($schoolClass->id, $senderInfo, $messageText);

        return response()->json([
            'success' => true,
            'message' => $sentMessage,
        ]);
    }

    public function togglePin(Request $request, int $classId, int $messageId): JsonResponse
    {
        $senderInfo = $this->getCurrentUserSenderInfo();

        if (! in_array($senderInfo['sender_type'], ['admin', 'teacher'])) {
            return response()->json([
                'success' => false,
                'message' => 'Chỉ Giáo viên hoặc Admin mới có quyền ghim tin nhắn.',
            ], 403);
        }

        $pinnedResult = $this->chatService->togglePinMessage($classId, $messageId, $senderInfo['sender_name']);

        return response()->json([
            'success'        => true,
            'pinned_message' => $pinnedResult,
        ]);
    }

    /**
     * @return array{sender_type: string, sender_id: int, sender_name: string, sender_avatar: string|null, can_pin: bool}
     */
    protected function getCurrentUserSenderInfo(): array
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        if ($admin) {
            return [
                'sender_type'   => 'admin',
                'sender_id'     => $admin->id,
                'sender_name'   => $admin->full_name ?? $admin->name ?? 'Admin',
                'sender_avatar' => $admin->avatar ?? null,
                'can_pin'       => true,
            ];
        }

        /** @var Teacher|null $teacher */
        $teacher = Auth::guard('teacher')->user();

        if ($teacher) {
            return [
                'sender_type'   => 'teacher',
                'sender_id'     => $teacher->id,
                'sender_name'   => $teacher->full_name ?? 'Giáo viên',
                'sender_avatar' => $teacher->avatar ?? null,
                'can_pin'       => true,
            ];
        }

        /** @var Student|null $student */
        $student = Auth::guard('student')->user();

        if ($student) {
            return [
                'sender_type'   => 'student',
                'sender_id'     => $student->id,
                'sender_name'   => $student->full_name ?? 'Học sinh',
                'sender_avatar' => $student->avatar ?? null,
                'can_pin'       => false,
            ];
        }

        return [
            'sender_type'   => 'admin',
            'sender_id'     => 1,
            'sender_name'   => 'Quản trị viên Trung tâm',
            'sender_avatar' => null,
            'can_pin'       => true,
        ];
    }
}

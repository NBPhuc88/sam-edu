<?php

namespace App\Http\Controllers;

use App\Enums\Constant;
use App\Http\Requests\Chat\FilterChatGroupRequest;
use App\Http\Requests\Chat\ReactClassChatMessageRequest;
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

    public function groups(FilterChatGroupRequest $request): InertiaResponse
    {
        $search   = $request->input('search');
        $centerId = $request->input('center_id') ? (int) $request->input('center_id') : null;
        $classId  = $request->input('class_id') ? (int) $request->input('class_id') : null;
        $status   = $request->input('status');
        $page     = $request->integer('page', 1);
        $perPage  = $request->integer('per_page', 12);

        $chatGroups = $this->chatService->getPaginatedChatGroups(
            is_string($search) ? $search : null,
            $centerId,
            $classId,
            is_string($status) ? $status : null,
            $perPage,
            $page
        );

        $formData = $this->chatService->getChatGroupFormData();

        return Inertia::render('Admin/Chat/Index', [
            'chatGroups' => $chatGroups,
            'centers'    => $formData['centers'] ?? [],
            'classes'    => $formData['classes'] ?? [],
            'filters'    => [
                'search'    => $search ?? '',
                'center_id' => $centerId,
                'class_id'  => $classId,
                'status'    => $status ?? '1',
                'per_page'  => $perPage,
            ],
            'isSuperAdmin' => (bool) ($formData['isSuperAdmin'] ?? false),
        ]);
    }

    public function index(Request $request, int $classId): InertiaResponse
    {
        $currentUser = $this->getCurrentUserSenderInfo();
        $chatRoom    = $this->chatService->getOpeningChatData($classId, $currentUser);

        return Inertia::render('Admin/Classes/Chat', [
            'lastReadMessageId'    => $chatRoom['lastReadMessageId'],
            'schoolClass'          => $chatRoom['schoolClass'],
            'currentUser'          => $currentUser,
            'initialMessages'      => $chatRoom['messages'],
            'initialPinnedMessage' => $chatRoom['pinnedMessage'],
        ]);
    }

    public function getMessages(int $classId): JsonResponse
    {
        $this->chatService->authorizeAccess($classId);

        $messages      = $this->chatService->getRecentMessages($classId);
        $pinnedMessage = $this->chatService->getPinnedMessage($classId);

        return response()->json([
            'messages'       => $messages,
            'pinned_message' => $pinnedMessage,
        ]);
    }

    public function sendMessage(SendClassChatMessageRequest $request, int $classId): JsonResponse
    {
        $schoolClass = $this->chatService->authorizeAccess($classId);
        $senderInfo  = $this->getCurrentUserSenderInfo();
        $messageText = (string) $request->input('message');
        $replyToId   = $request->input('reply_to_id') ? (int) $request->input('reply_to_id') : null;

        $sentMessage = $this->chatService->sendMessage($schoolClass->id, $senderInfo, $messageText, $replyToId);

        return response()->json([
            'success' => true,
            'message' => $sentMessage,
        ]);
    }

    public function react(ReactClassChatMessageRequest $request, int $classId, int $messageId): JsonResponse
    {
        $this->chatService->authorizeAccess($classId);
        $senderInfo = $this->getCurrentUserSenderInfo();
        $emoji      = (string) $request->input('emoji');

        $reactions = $this->chatService->toggleReaction($classId, $messageId, $senderInfo, $emoji);

        return response()->json([
            'success'   => true,
            'reactions' => $reactions,
        ]);
    }

    public function togglePin(Request $request, int $classId, int $messageId): JsonResponse
    {
        $this->chatService->authorizeAccess($classId);
        $senderInfo = $this->getCurrentUserSenderInfo();

        if (! $senderInfo['can_pin']) {
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
     * @return array{sender_type: int, sender_id: int, sender_name: string, sender_avatar: string|null, can_pin: bool}
     */
    protected function getCurrentUserSenderInfo(): array
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        if ($admin) {
            return [
                'sender_type'   => Constant::SENDER_TYPE_ADMIN,
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
                'sender_type'   => Constant::SENDER_TYPE_TEACHER,
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
                'sender_type'   => Constant::SENDER_TYPE_STUDENT,
                'sender_id'     => $student->id,
                'sender_name'   => $student->full_name ?? 'Học sinh',
                'sender_avatar' => $student->avatar ?? null,
                'can_pin'       => false,
            ];
        }

        return [
            'sender_type'   => Constant::SENDER_TYPE_ADMIN,
            'sender_id'     => 1,
            'sender_name'   => 'Quản trị viên Trung tâm',
            'sender_avatar' => null,
            'can_pin'       => true,
        ];
    }
}

<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class ClassChatMessagePinned implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;

    /**
     * @param array<string, mixed>|null $pinnedMessageData
     * @param int                       $classId
     */
    public function __construct(
        public int $classId,
        public ?array $pinnedMessageData
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new Channel("class-chat.{$this->classId}");
    }

    public function broadcastAs(): string
    {
        return 'message.pinned';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'class_id'       => $this->classId,
            'pinned_message' => $this->pinnedMessageData,
        ];
    }
}

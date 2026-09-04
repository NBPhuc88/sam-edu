<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class ClassChatMessageReacted implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;

    /**
     * @param int                              $classId
     * @param int                              $messageId
     * @param array<int, array<string, mixed>> $reactions
     */
    public function __construct(
        public int $classId,
        public int $messageId,
        public array $reactions
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("class-chat.{$this->classId}");
    }

    public function broadcastAs(): string
    {
        return 'message.reacted';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'class_id'   => $this->classId,
            'message_id' => $this->messageId,
            'reactions'  => $this->reactions,
        ];
    }
}

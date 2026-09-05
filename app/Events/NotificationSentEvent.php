<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class NotificationSentEvent implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;

    /**
     * @param string               $recipientType    String identifier: 'admin', 'teacher', or 'student'
     * @param int                  $recipientId
     * @param array<string, mixed> $notificationData
     */
    public function __construct(
        public string $recipientType,
        public int $recipientId,
        public array $notificationData
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("notifications.{$this->recipientType}.{$this->recipientId}");
    }

    public function broadcastAs(): string
    {
        return 'notification.sent';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return $this->notificationData;
    }
}

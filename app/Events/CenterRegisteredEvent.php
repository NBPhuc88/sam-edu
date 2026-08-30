<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class CenterRegisteredEvent implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;

    /**
     * @param array<string, mixed> $notificationData
     */
    public function __construct(
        public array $notificationData
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('super-admin-notifications');
    }

    public function broadcastAs(): string
    {
        return 'center.registered';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return $this->notificationData;
    }
}

<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class GameRoomReactionSent implements ShouldBroadcastNow
{
    /**
     * @param array<string, mixed> $payload
     * @param int                  $roomId
     */
    public function __construct(public int $roomId, public array $payload = [])
    {
    }
    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("game-room.{$this->roomId}");
    }
    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return ['room_id' => $this->roomId] + $this->payload;
    }
}

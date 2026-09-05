<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameRoomAnswer extends Model
{
    use HasFactory;
    protected $fillable = ['game_room_id', 'game_room_participant_id', 'question_index', 'answer', 'response_seconds', 'is_correct', 'points'];
    protected function casts(): array
    {
        return ['answer' => 'json', 'response_seconds' => 'float', 'is_correct' => 'boolean', 'points' => 'integer'];
    }
    public function participant(): BelongsTo
    {
        return $this->belongsTo(GameRoomParticipant::class, 'game_room_participant_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameRoomParticipant extends Model
{
    use HasFactory;
    protected $fillable = ['game_room_id', 'student_id', 'total_score', 'streak_count'];
    protected function casts(): array
    {
        return ['total_score' => 'integer', 'streak_count' => 'integer'];
    }
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
    public function room(): BelongsTo
    {
        return $this->belongsTo(GameRoom::class, 'game_room_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameRoom extends Model
{
    use HasFactory;
    protected $dateFormat = 'Y-m-d H:i:s.u';
    protected $attributes = ['status' => 1, 'question_index' => 0, 'question_time_limit' => 20, 'countdown_seconds' => 5];
    protected $hidden     = ['questions'];
    protected $fillable   = ['center_id', 'exam_id', 'host_admin_id', 'host_teacher_id', 'code', 'pin', 'name', 'question_time_limit', 'countdown_seconds', 'scoring_rules', 'questions', 'status', 'question_index', 'question_started_at', 'expires_at'];
    protected function casts(): array
    {
        return ['questions' => 'array', 'scoring_rules' => 'array', 'status' => 'integer', 'question_index' => 'integer', 'question_time_limit' => 'integer', 'countdown_seconds' => 'integer', 'question_started_at' => 'immutable_datetime', 'expires_at' => 'immutable_datetime'];
    }
    public function participants(): HasMany
    {
        return $this->hasMany(GameRoomParticipant::class);
    }
    public function answers(): HasMany
    {
        return $this->hasMany(GameRoomAnswer::class);
    }
    public function hostAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'host_admin_id');
    }
    public function hostTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'host_teacher_id');
    }
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }
}

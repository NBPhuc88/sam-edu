<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionReschedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'old_date',
        'old_start_time',
        'old_end_time',
        'old_room_id',
        'new_date',
        'new_start_time',
        'new_end_time',
        'new_room_id',
        'reason',
        'changed_by_admin_id',
        'changed_by_teacher_id',
        'changed_at',
    ];

    protected function casts(): array
    {
        return [
            'old_date'   => 'date',
            'new_date'   => 'date',
            'changed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<ClassSession, $this>
     */
    public function classSession(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class, 'session_id');
    }

    /**
     * @return BelongsTo<Room, $this>
     */
    public function oldRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'old_room_id');
    }

    /**
     * @return BelongsTo<Room, $this>
     */
    public function newRoom(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'new_room_id');
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function changedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'changed_by_admin_id');
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function changedByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'changed_by_teacher_id');
    }
}

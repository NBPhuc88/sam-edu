<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_subject_id',
        'class_schedule_id',
        'teacher_id',
        'room_id',
        'session_date',
        'start_time',
        'end_time',
        'status',
        'topic',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'status'       => 'integer',
            'session_date' => 'date:d-m-Y',
            'created_at'   => 'datetime:d-m-Y H:i',
            'updated_at'   => 'datetime:d-m-Y H:i',
        ];
    }

    /**
     * @return BelongsTo<ClassSubject, $this>
     */
    public function classSubject(): BelongsTo
    {
        return $this->belongsTo(ClassSubject::class);
    }

    /**
     * @return BelongsTo<ClassSchedule, $this>
     */
    public function classSchedule(): BelongsTo
    {
        return $this->belongsTo(ClassSchedule::class);
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class)->withTrashed();
    }

    /**
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class)->withTrashed();
    }

    /**
     * @return HasMany<Attendance, $this>
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'session_id');
    }

    /**
     * @return HasMany<SessionReschedule, $this>
     */
    public function reschedules(): HasMany
    {
        return $this->hasMany(SessionReschedule::class, 'session_id');
    }
}

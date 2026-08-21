<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_subject_id',
        'weeks',
        'auto_holidays',
        'excluded_holiday_ids',
        'holidays',
        'off_days',
        'extra_days',
        'room_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'weeks'                => 'array',
            'auto_holidays'        => 'boolean',
            'excluded_holiday_ids' => 'array',
            'holidays'             => 'array',
            'off_days'             => 'array',
            'extra_days'           => 'array',
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
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * @return HasMany<ClassSession, $this>
     */
    public function classSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class);
    }
}

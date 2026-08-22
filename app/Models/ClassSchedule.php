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
            'auto_holidays'        => 'boolean',
            'excluded_holiday_ids' => 'array',
            'holidays'             => 'array',
            'off_days'             => 'array',
            'extra_days'           => 'array',
        ];
    }

    /**
     * @return \Illuminate\Database\Eloquent\Casts\Attribute<array<string, array<int, array{0: string, 1: string}>>, mixed>
     */
    protected function weeks(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: function ($value) {
                if (empty($value)) {
                    return [];
                }

                $decoded = is_string($value) ? json_decode($value, true) : $value;

                if (! is_array($decoded)) {
                    return [];
                }

                $normalized = [];

                foreach ($decoded as $key => $slots) {
                    $dayKey = (string) $key;

                    if (is_array($slots)) {
                        foreach ($slots as $slot) {
                            if (is_array($slot)) {
                                $start = $slot['start_time'] ?? $slot['start'] ?? $slot[0] ?? null;
                                $end   = $slot['end_time'] ?? $slot['end'] ?? $slot[1] ?? null;

                                if (! empty($start) && ! empty($end)) {
                                    $normalized[$dayKey][] = [
                                        substr((string) $start, 0, 5),
                                        substr((string) $end, 0, 5),
                                    ];
                                }
                            }
                        }
                    }
                }

                return $normalized;
            },
            set: fn ($value) => is_string($value) ? $value : json_encode($value ?: new \stdClass()),
        );
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

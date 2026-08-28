<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'center_id',
        'title',
        'content',
        'type',
        'created_by_admin_id',
        'created_by_teacher_id',
    ];

    protected function casts(): array
    {
        return [
            'type'       => 'integer',
            'created_at' => 'datetime:d-m-Y H:i',
            'updated_at' => 'datetime:d-m-Y H:i',
        ];
    }

    public function setTypeAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['type'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['type'] = match ($value) {
                'tuition'              => \App\Enums\Constant::NOTIFICATION_TYPE_TUITION,
                'exam'                 => \App\Enums\Constant::NOTIFICATION_TYPE_EXAM,
                'schedule'             => \App\Enums\Constant::NOTIFICATION_TYPE_SCHEDULE,
                'attendance'           => \App\Enums\Constant::NOTIFICATION_TYPE_ATTENDANCE,
                'subscription_renewal' => 6,
                'center_registration'  => 7,
                default                => \App\Enums\Constant::NOTIFICATION_TYPE_GENERAL,
            };
        } else {
            $this->attributes['type'] = (int) $value;
        }
    }

    /**
     * @return BelongsTo<Center, $this>
     */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function createdByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'created_by_teacher_id');
    }

    /**
     * @return HasMany<NotificationRecipient, $this>
     */
    public function recipients(): HasMany
    {
        return $this->hasMany(NotificationRecipient::class);
    }
}

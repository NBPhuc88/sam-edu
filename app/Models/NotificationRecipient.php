<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class NotificationRecipient extends Model
{
    use HasFactory;

    protected $fillable = [
        'notification_id',
        'recipient_type',
        'recipient_id',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'recipient_type' => 'integer',
            'read_at'        => 'datetime:d-m-Y H:i',
            'created_at'     => 'datetime:d-m-Y H:i',
            'updated_at'     => 'datetime:d-m-Y H:i',
        ];
    }

    public function setRecipientTypeAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['recipient_type'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['recipient_type'] = match ($value) {
                'admin'   => \App\Enums\Constant::ACCOUNT_TYPE_ADMIN,
                'teacher' => \App\Enums\Constant::ACCOUNT_TYPE_TEACHER,
                'student' => \App\Enums\Constant::ACCOUNT_TYPE_STUDENT,
                default   => \App\Enums\Constant::ACCOUNT_TYPE_ADMIN,
            };
        } else {
            $this->attributes['recipient_type'] = (int) $value;
        }
    }

    /**
     * @return BelongsTo<Notification, $this>
     */
    public function notification(): BelongsTo
    {
        return $this->belongsTo(Notification::class);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function recipient(): MorphTo
    {
        return $this->morphTo();
    }
}

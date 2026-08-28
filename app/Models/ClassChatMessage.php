<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'reply_to_id',
        'sender_type',
        'sender_id',
        'sender_name',
        'sender_avatar',
        'message',
        'is_pinned',
        'pinned_at',
        'pinned_by_name',
    ];

    protected function casts(): array
    {
        return [
            'sender_type' => 'integer',
            'reply_to_id' => 'integer',
            'is_pinned'   => 'boolean',
            'pinned_at'   => 'datetime',
            'created_at'  => 'datetime',
            'updated_at'  => 'datetime',
        ];
    }

    public function setSenderTypeAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['sender_type'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['sender_type'] = match ($value) {
                'admin'   => \App\Enums\Constant::ACCOUNT_TYPE_ADMIN,
                'teacher' => \App\Enums\Constant::ACCOUNT_TYPE_TEACHER,
                'student' => \App\Enums\Constant::ACCOUNT_TYPE_STUDENT,
                default   => \App\Enums\Constant::ACCOUNT_TYPE_ADMIN,
            };
        } else {
            $this->attributes['sender_type'] = (int) $value;
        }
    }

    /**
     * @return BelongsTo<SchoolClass, $this>
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * @return BelongsTo<ClassChatMessage, $this>
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_id');
    }

    /**
     * @return HasMany<ClassChatMessageReaction, $this>
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(ClassChatMessageReaction::class, 'message_id');
    }
}

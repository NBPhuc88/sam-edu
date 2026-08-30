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

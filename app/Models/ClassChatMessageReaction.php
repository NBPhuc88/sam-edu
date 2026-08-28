<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassChatMessageReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'class_id',
        'sender_type',
        'sender_id',
        'sender_name',
        'emoji',
    ];

    protected function casts(): array
    {
        return [
            'sender_type' => 'integer',
            'message_id'  => 'integer',
            'class_id'    => 'integer',
            'sender_id'   => 'integer',
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
     * @return BelongsTo<ClassChatMessage, $this>
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(ClassChatMessage::class, 'message_id');
    }

    /**
     * @return BelongsTo<SchoolClass, $this>
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }
}

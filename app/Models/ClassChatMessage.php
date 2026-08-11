<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
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
            'is_pinned'  => 'boolean',
            'pinned_at'  => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<SchoolClass, $this>
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }
}

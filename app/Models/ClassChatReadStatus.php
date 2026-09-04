<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassChatReadStatus extends Model
{
    protected $fillable = ['class_id', 'user_type', 'user_id', 'last_read_message_id', 'last_read_at'];

    protected function casts(): array
    {
        return ['user_type' => 'integer', 'user_id' => 'integer', 'last_read_message_id' => 'integer', 'last_read_at' => 'datetime'];
    }
}

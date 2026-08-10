<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $full_name
 * @property string $phone
 * @property string|null $email
 * @property string|null $center_name
 * @property string|null $message
 * @property string $status
 * @property string|null $admin_note
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class ContactRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'phone',
        'email',
        'center_name',
        'message',
        'status',
        'admin_note',
    ];
}

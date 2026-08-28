<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolePermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'role',
        'permission_id',
    ];

    protected function casts(): array
    {
        return [
            'role'          => 'integer',
            'permission_id' => 'integer',
        ];
    }

    public function setRoleAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['role'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['role'] = match ($value) {
                'super_admin' => \App\Enums\Constant::ROLE_SUPER_ADMIN,
                'teacher'     => \App\Enums\Constant::ROLE_TEACHER,
                'student'     => \App\Enums\Constant::ROLE_STUDENT,
                default       => \App\Enums\Constant::ROLE_ADMIN,
            };
        } else {
            $this->attributes['role'] = (int) $value;
        }
    }

    /**
     * @return BelongsTo<Permission, $this>
     */
    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class, 'permission_id');
    }
}

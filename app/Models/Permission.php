<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'module',
        'module_key',
        'module_order',
        'action',
        'description',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'module_order' => 'integer',
            'is_system'    => 'boolean',
        ];
    }

    /**
     * @return HasMany<RolePermission, $this>
     */
    public function rolePermissions(): HasMany
    {
        return $this->hasMany(RolePermission::class, 'permission_id');
    }
}

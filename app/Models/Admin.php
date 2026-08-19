<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Admin extends Authenticatable
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'username',
        'email',
        'password',
        'role',
        'status',
        'last_login_at',
        'admin_code',
        'full_name',
        'phone',
        'avatar',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
            'password'      => 'hashed',
            'role'          => 'string',
        ];
    }

    /**
     * Kiểm tra admin có phải super_admin hay không.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Danh sách Center mà Admin được phân công quản lý.
     * Lưu ý: Super Admin quản lý tất cả Center (không cần record trong admin_centers).
     *
     * @return BelongsToMany<Center, $this>
     */
    public function centers(): BelongsToMany
    {
        return $this->belongsToMany(Center::class, 'admin_centers');
    }

    /**
     * Lấy ID Trung tâm duy nhất được phân công cho Admin phụ.
     */
    public function assignedCenterId(): ?int
    {
        if ($this->isSuperAdmin()) {
            return null;
        }

        return $this->centers()->pluck('centers.id')->first();
    }

    /**
     * @return MorphMany<RefreshToken, $this>
     */
    public function refreshTokens(): MorphMany
    {
        return $this->morphMany(RefreshToken::class, 'tokenable');
    }
}

<?php

namespace App\Models;

use App\Enums\Constant;
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
        'current_session_id',
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
            'last_login_at' => 'datetime:d-m-Y H:i',
            'password'      => 'hashed',
            'role'          => 'integer',
            'status'        => 'integer',
            'created_at'    => 'datetime:d-m-Y H:i',
            'updated_at'    => 'datetime:d-m-Y H:i',
        ];
    }

    public function setRoleAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['role'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['role'] = match ($value) {
                'super_admin' => Constant::ROLE_SUPER_ADMIN,
                'admin'       => Constant::ROLE_ADMIN,
                default       => Constant::ROLE_ADMIN,
            };
        } else {
            $this->attributes['role'] = (int) $value;
        }
    }

    public function setStatusAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['status'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['status'] = match ($value) {
                'inactive', 'paused' => Constant::STATUS_INACTIVE,
                default              => Constant::STATUS_ACTIVE,
            };
        } else {
            $this->attributes['status'] = (int) $value;
        }
    }

    /**
     * Kiểm tra admin có phải super_admin hay không.
     */
    public function isSuperAdmin(): bool
    {
        return (int) $this->role === Constant::ROLE_SUPER_ADMIN;
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

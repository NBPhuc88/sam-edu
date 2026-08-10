<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Teacher extends Authenticatable
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'username',
        'email',
        'password',
        'status',
        'last_login_at',
        'teacher_code',
        'center_id',
        'first_name',
        'last_name',
        'full_name',
        'phone',
        'date_of_birth',
        'gender',
        'avatar',
        'hire_date',
        'specialization',
        'note',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
            'date_of_birth' => 'date',
            'hire_date' => 'date',
            'password' => 'hashed',
        ];
    }

    /**
     * @return BelongsTo<Center, $this>
     */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /**
     * @return HasMany<ClassSubject, $this>
     */
    public function classSubjects(): HasMany
    {
        return $this->hasMany(ClassSubject::class);
    }

    /**
     * @return HasMany<ClassSession, $this>
     */
    public function classSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class);
    }

    /**
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'teacher_roles');
    }

    /**
     * @return MorphMany<RefreshToken, $this>
     */
    public function refreshTokens(): MorphMany
    {
        return $this->morphMany(RefreshToken::class, 'tokenable');
    }
}

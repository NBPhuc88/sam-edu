<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Teacher extends Authenticatable
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'username',
        'email',
        'password',
        'status',
        'last_login_at',
        'current_session_id',
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
            'last_login_at' => 'datetime:d-m-Y H:i',
            'date_of_birth' => 'date:d-m-Y',
            'hire_date'     => 'date:d-m-Y',
            'password'      => 'hashed',
            'status'        => 'integer',
            'gender'        => 'integer',
            'created_at'    => 'datetime:d-m-Y H:i',
            'updated_at'    => 'datetime:d-m-Y H:i',
        ];
    }

    public function setStatusAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['status'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['status'] = match ($value) {
                'inactive', 'paused', 'locked', 'suspended' => \App\Enums\Constant::STATUS_INACTIVE,
                default                                     => \App\Enums\Constant::STATUS_ACTIVE,
            };
        } else {
            $this->attributes['status'] = (int) $value;
        }
    }

    public function setGenderAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['gender'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['gender'] = match ($value) {
                'male'   => \App\Enums\Constant::GENDER_MALE,
                'female' => \App\Enums\Constant::GENDER_FEMALE,
                default  => \App\Enums\Constant::GENDER_OTHER,
            };
        } else {
            $this->attributes['gender'] = (int) $value;
        }
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
     * @return MorphMany<RefreshToken, $this>
     */
    public function refreshTokens(): MorphMany
    {
        return $this->morphMany(RefreshToken::class, 'tokenable');
    }
}

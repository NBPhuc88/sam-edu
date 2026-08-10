<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Student extends Authenticatable
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'username',
        'email',
        'password',
        'status',
        'last_login_at',
        'student_code',
        'center_id',
        'first_name',
        'last_name',
        'full_name',
        'date_of_birth',
        'gender',
        'phone',
        'address',
        'avatar',
        'parent_name',
        'parent_phone',
        'parent_relationship',
        'admission_date',
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
            'admission_date' => 'date',
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
     * @return HasMany<ClassStudent, $this>
     */
    public function classStudents(): HasMany
    {
        return $this->hasMany(ClassStudent::class);
    }

    /**
     * @return HasMany<Attendance, $this>
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * @return HasMany<ExamResult, $this>
     */
    public function examResults(): HasMany
    {
        return $this->hasMany(ExamResult::class);
    }

    /**
     * @return HasMany<StudentNote, $this>
     */
    public function notes(): HasMany
    {
        return $this->hasMany(StudentNote::class);
    }

    /**
     * @return HasMany<StudentDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class);
    }

    /**
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'student_roles');
    }

    /**
     * @return MorphMany<RefreshToken, $this>
     */
    public function refreshTokens(): MorphMany
    {
        return $this->morphMany(RefreshToken::class, 'tokenable');
    }
}

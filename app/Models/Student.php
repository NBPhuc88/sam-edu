<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Student extends Authenticatable
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
            'status'         => \App\Enums\EntityStatus::class,
            'last_login_at'  => 'datetime:d-m-Y H:i',
            'date_of_birth'  => 'date:d-m-Y',
            'admission_date' => 'date:d-m-Y',
            'password'       => 'hashed',
            'created_at'     => 'datetime:d-m-Y H:i',
            'updated_at'     => 'datetime:d-m-Y H:i',
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
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<SchoolClass, $this>
     */
    public function classes(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_students', 'student_id', 'class_id')
            ->withPivot('enrolled_at', 'left_at', 'status', 'note')
            ->withTimestamps();
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
     * @return HasMany<StudentTuition, $this>
     */
    public function tuitions(): HasMany
    {
        return $this->hasMany(StudentTuition::class, 'student_id');
    }

    /**
     * @return MorphMany<RefreshToken, $this>
     */
    public function refreshTokens(): MorphMany
    {
        return $this->morphMany(RefreshToken::class, 'tokenable');
    }
}

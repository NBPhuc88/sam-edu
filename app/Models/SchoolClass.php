<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'center_id',
        'code',
        'name',
        'description',
        'max_students',
        'start_date',
        'end_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status'       => \App\Enums\EntityStatus::class,
            'max_students' => 'integer',
            'start_date'   => 'date',
            'end_date'     => 'date',
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
        return $this->hasMany(ClassStudent::class, 'class_id');
    }

    /**
     * @return BelongsToMany<Student, $this>
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'class_students', 'class_id', 'student_id')
            ->withPivot('enrolled_at', 'left_at', 'status', 'note')
            ->withTimestamps();
    }

    /**
     * @return HasMany<ClassSubject, $this>
     */
    public function classSubjects(): HasMany
    {
        return $this->hasMany(ClassSubject::class, 'class_id');
    }
}

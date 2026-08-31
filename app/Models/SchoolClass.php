<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'total_tuition_fee',
    ];

    protected function casts(): array
    {
        return [
            'status'            => 'integer',
            'max_students'      => 'integer',
            'total_tuition_fee' => 'decimal:0',
            'start_date'        => 'date:d-m-Y',
            'end_date'          => 'date:d-m-Y',
            'created_at'        => 'datetime:d-m-Y H:i',
            'updated_at'        => 'datetime:d-m-Y H:i',
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

    /**
     * @return HasMany<StudentTuition, $this>
     */
    public function tuitions(): HasMany
    {
        return $this->hasMany(StudentTuition::class, 'class_id');
    }

    /**
     * @return HasMany<ClassExam, $this>
     */
    public function classExams(): HasMany
    {
        return $this->hasMany(ClassExam::class, 'class_id');
    }

    /**
     * @return HasMany<ClassChatMessage, $this>
     */
    public function chatMessages(): HasMany
    {
        return $this->hasMany(ClassChatMessage::class, 'class_id');
    }

    /**
     * @return HasOne<ClassChatMessage, $this>
     */
    public function latestChatMessage(): HasOne
    {
        return $this->hasOne(ClassChatMessage::class, 'class_id')->latestOfMany();
    }

    public function getTotalTuitionFeeAttribute(): float
    {
        if (isset($this->attributes['total_tuition_fee']) && $this->attributes['total_tuition_fee'] !== null) {
            return (float) $this->attributes['total_tuition_fee'];
        }

        return (float) ($this->classSubjects->sum(fn ($cs) => $cs->final_tuition_fee) ?: 0);
    }
}

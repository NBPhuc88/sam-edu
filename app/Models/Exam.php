<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exam extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'class_subject_id',
        'name',
        'description',
        'exam_date',
        'start_time',
        'end_time',
        'max_score',
        'status',
        'created_by_teacher_id',
        'created_by_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'exam_date' => 'date',
            'max_score' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<ClassSubject, $this>
     */
    public function classSubject(): BelongsTo
    {
        return $this->belongsTo(ClassSubject::class);
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function createdByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'created_by_teacher_id');
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }

    /**
     * @return HasMany<ExamResult, $this>
     */
    public function examResults(): HasMany
    {
        return $this->hasMany(ExamResult::class);
    }
}

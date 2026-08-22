<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exam extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'center_id',
        'class_id',
        'subject_id',
        'class_subject_id',
        'code',
        'name',
        'exam_type_id',
        'duration_minutes',
        'max_score',
        'pass_score',
        'shuffle_questions',
        'shuffle_options',
        'max_attempts',
        'is_practice',
        'description',
        'exam_date',
        'start_time',
        'end_time',
        'status',
        'created_by_teacher_id',
        'created_by_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'exam_date'         => 'date:d-m-Y',
            'exam_type_id'      => 'integer',
            'max_score'         => 'decimal:2',
            'pass_score'        => 'decimal:2',
            'duration_minutes'  => 'integer',
            'max_attempts'      => 'integer',
            'shuffle_questions' => 'boolean',
            'shuffle_options'   => 'boolean',
            'is_practice'       => 'boolean',
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
     * @return BelongsTo<ExamType, $this>
     */
    public function examType(): BelongsTo
    {
        return $this->belongsTo(ExamType::class, 'exam_type_id');
    }

    /**
     * @return BelongsTo<SchoolClass, $this>
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
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
     * @return HasMany<ExamSection, $this>
     */
    public function sections(): HasMany
    {
        return $this->hasMany(ExamSection::class)->orderBy('order_index');
    }

    /**
     * @return HasMany<ExamQuestion, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class)->orderBy('order_index');
    }

    /**
     * @return HasMany<ExamResult, $this>
     */
    public function examResults(): HasMany
    {
        return $this->hasMany(ExamResult::class);
    }

    /**
     * @return HasMany<ClassExam, $this>
     */
    public function classExams(): HasMany
    {
        return $this->hasMany(ClassExam::class, 'exam_id');
    }
}

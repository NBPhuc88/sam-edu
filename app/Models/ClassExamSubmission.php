<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassExamSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_exam_id',
        'student_id',
        'attempt_number',
        'started_at',
        'submitted_at',
        'duration_seconds_used',
        'score',
        'total_correct',
        'total_questions',
        'status',
        'is_graded',
        'requires_manual_grading',
        'graded_at',
        'graded_by_teacher_id',
        'graded_by_admin_id',
        'teacher_feedback',
        'answers',
        'grading_details',
    ];

    protected function casts(): array
    {
        return [
            'started_at'              => 'datetime:d-m-Y H:i',
            'submitted_at'            => 'datetime:d-m-Y H:i',
            'graded_at'               => 'datetime:d-m-Y H:i',
            'duration_seconds_used'   => 'integer',
            'score'                   => 'decimal:2',
            'total_correct'           => 'integer',
            'total_questions'         => 'integer',
            'is_graded'               => 'boolean',
            'requires_manual_grading' => 'boolean',
            'answers'                 => 'array',
            'grading_details'         => 'array',
            'created_at'              => 'datetime:d-m-Y H:i',
            'updated_at'              => 'datetime:d-m-Y H:i',
        ];
    }

    /**
     * @return BelongsTo<ClassExam, $this>
     */
    public function classExam(): BelongsTo
    {
        return $this->belongsTo(ClassExam::class, 'class_exam_id');
    }

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function gradedByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'graded_by_teacher_id');
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function gradedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'graded_by_admin_id');
    }
}

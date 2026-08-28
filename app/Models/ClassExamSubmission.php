<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ClassExamSubmission extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::deleting(function (ClassExamSubmission $submission) {
            $submission->deleteAudioFiles();
        });
    }

    /**
     * Xóa các tệp ghi âm speaking liên quan đến bài làm này khỏi disk.
     */
    public function deleteAudioFiles(): void
    {
        $answers = $this->answers;

        if (! is_array($answers)) {
            return;
        }

        $samDisk   = Storage::disk('sam');
        $localDisk = Storage::disk('local');

        foreach ($answers as $answer) {
            if (is_string($answer) && (str_starts_with($answer, 'exams/speaking/') || str_starts_with($answer, 'exam/'))) {
                $cleanPath = trim(str_replace('\\', '/', $answer), '/');

                if ($samDisk->exists($cleanPath)) {
                    $samDisk->delete($cleanPath);
                }

                if ($localDisk->exists($cleanPath)) {
                    $localDisk->delete($cleanPath);
                }
            }
        }
    }

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
            'status'                  => 'integer',
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

    public function setStatusAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['status'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['status'] = match ($value) {
                'submitted'         => \App\Enums\Constant::SUBMISSION_STATUS_SUBMITTED,
                'timeout_submitted' => \App\Enums\Constant::SUBMISSION_STATUS_TIMEOUT_SUBMITTED,
                'missed'            => \App\Enums\Constant::SUBMISSION_STATUS_MISSED,
                default             => \App\Enums\Constant::SUBMISSION_STATUS_IN_PROGRESS,
            };
        } else {
            $this->attributes['status'] = (int) $value;
        }
    }

    /**
     * @return BelongsTo<ClassExam, $this>
     */
    public function classExam(): BelongsTo
    {
        return $this->belongsTo(ClassExam::class, 'class_exam_id')->withTrashed();
    }

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id')->withTrashed();
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function gradedByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'graded_by_teacher_id')->withTrashed();
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function gradedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'graded_by_admin_id');
    }
}

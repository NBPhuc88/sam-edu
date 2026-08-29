<?php

namespace App\Models;

use App\Enums\Constant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClassExam extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (ClassExam $classExam) {
            if (empty($classExam->code)) {
                $maxId           = (int) (static::withTrashed()->max('id') ?? 0);
                $classExam->code = sprintf('CE%0' . Constant::CODE_PAD_LENGTH . 'd', $maxId + 1);
            }

            if (empty($classExam->access_code)) {
                $classExam->access_code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            }
        });
    }

    protected $fillable = [
        'code',
        'access_code',
        'class_id',
        'exam_id',
        'title',
        'exam_date',
        'start_time',
        'end_time',
        'valid_from',
        'valid_to',
        'duration_minutes',
        'max_score',
        'pass_score',
        'status',
        'created_by_teacher_id',
        'created_by_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'status'           => 'integer',
            'exam_date'        => 'date:d-m-Y',
            'valid_from'       => 'datetime:d-m-Y H:i',
            'valid_to'         => 'datetime:d-m-Y H:i',
            'duration_minutes' => 'integer',
            'max_score'        => 'decimal:2',
            'pass_score'       => 'decimal:2',
            'created_at'       => 'datetime:d-m-Y H:i',
            'updated_at'       => 'datetime:d-m-Y H:i',
        ];
    }

    /**
     * @return BelongsTo<SchoolClass, $this>
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id')->withTrashed();
    }

    /**
     * @return BelongsTo<Exam, $this>
     */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class, 'exam_id')->withTrashed();
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function createdByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'created_by_teacher_id')->withTrashed();
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }

    /**
     * @return HasMany<ClassExamSubmission, $this>
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(ClassExamSubmission::class, 'class_exam_id');
    }

    /**
     * @return HasMany<ExamResult, $this>
     */
    public function results(): HasMany
    {
        return $this->hasMany(ExamResult::class, 'class_exam_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'student_id',
        'score',
        'grade',
        'comment',
        'entered_by_teacher_id',
        'entered_by_admin_id',
        'entered_at',
        'updated_by_teacher_id',
        'updated_by_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'entered_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Exam, $this>
     */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function enteredByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'entered_by_teacher_id');
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function enteredByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'entered_by_admin_id');
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function updatedByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'updated_by_teacher_id');
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function updatedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'updated_by_admin_id');
    }

    /**
     * @return HasMany<ExamResultHistory, $this>
     */
    public function histories(): HasMany
    {
        return $this->hasMany(ExamResultHistory::class);
    }
}

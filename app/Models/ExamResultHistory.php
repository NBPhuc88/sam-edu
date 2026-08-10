<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResultHistory extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'exam_result_id',
        'old_score',
        'new_score',
        'old_comment',
        'new_comment',
        'changed_by_teacher_id',
        'changed_by_admin_id',
        'reason',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'old_score' => 'decimal:2',
            'new_score' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<ExamResult, $this>
     */
    public function examResult(): BelongsTo
    {
        return $this->belongsTo(ExamResult::class);
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function changedByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'changed_by_teacher_id');
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function changedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'changed_by_admin_id');
    }
}

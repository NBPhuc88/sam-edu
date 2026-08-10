<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'content',
        'created_by_admin_id',
        'created_by_teacher_id',
    ];

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function createdByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'created_by_teacher_id');
    }
}

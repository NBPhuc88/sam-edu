<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'student_id',
        'status',
        'check_in_at',
        'check_out_at',
        'note',
        'marked_by_teacher_id',
        'marked_by_admin_id',
        'marked_at',
    ];

    protected function casts(): array
    {
        return [
            'check_in_at'  => 'datetime:d-m-Y H:i',
            'check_out_at' => 'datetime:d-m-Y H:i',
            'marked_at'    => 'datetime:d-m-Y H:i',
            'created_at'   => 'datetime:d-m-Y H:i',
            'updated_at'   => 'datetime:d-m-Y H:i',
        ];
    }

    /**
     * @return BelongsTo<ClassSession, $this>
     */
    public function classSession(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class, 'session_id');
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
    public function markedByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'marked_by_teacher_id');
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function markedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'marked_by_admin_id');
    }
}

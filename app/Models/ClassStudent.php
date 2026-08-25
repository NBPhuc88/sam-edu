<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassStudent extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'student_id',
        'enrolled_at',
        'left_at',
        'status',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime:d-m-Y H:i',
            'left_at'     => 'datetime:d-m-Y H:i',
            'created_at'  => 'datetime:d-m-Y H:i',
            'updated_at'  => 'datetime:d-m-Y H:i',
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
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class)->withTrashed();
    }
}

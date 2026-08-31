<?php

namespace App\Models;

use App\Enums\Constant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'subject_id',
        'teacher_id',
        'start_date',
        'end_date',
        'status',
        'tuition_fee',
        'discount_type',
        'discount_value',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'status'         => 'integer',
            'tuition_fee'    => 'decimal:0',
            'discount_type'  => 'integer',
            'discount_value' => 'decimal:2',
            'start_date'     => 'date:d-m-Y',
            'end_date'       => 'date:d-m-Y',
            'created_at'     => 'datetime:d-m-Y H:i',
            'updated_at'     => 'datetime:d-m-Y H:i',
        ];
    }

    public function getFinalTuitionFeeAttribute(): float
    {
        $fee = (float) ($this->tuition_fee ?? 0);

        if ($fee <= 0) {
            return 0.0;
        }

        $type  = $this->discount_type ? (int) $this->discount_type : null;
        $value = (float) ($this->discount_value ?? 0);

        if ($type === Constant::DISCOUNT_TYPE_DIRECT) {
            return max(0.0, $fee - $value);
        }

        if ($type === Constant::DISCOUNT_TYPE_PERCENTAGE) {
            return max(0.0, round($fee * (1 - ($value / 100)), 2));
        }

        return $fee;
    }

    /**
     * @return BelongsTo<SchoolClass, $this>
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id')->withTrashed();
    }

    /**
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id')->withTrashed();
    }

    /**
     * @return BelongsTo<Teacher, $this>
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class)->withTrashed();
    }

    /**
     * @return HasMany<ClassSchedule, $this>
     */
    public function classSchedules(): HasMany
    {
        return $this->hasMany(ClassSchedule::class);
    }

    /**
     * @return HasMany<ClassSession, $this>
     */
    public function classSessions(): HasMany
    {
        return $this->hasMany(ClassSession::class);
    }

    /**
     * @return HasMany<Exam, $this>
     */
    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }
}

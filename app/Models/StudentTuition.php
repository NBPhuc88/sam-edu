<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int                             $id
 * @property int                             $center_id
 * @property int                             $student_id
 * @property int                             $class_id
 * @property string|null                     $title
 * @property float                           $total_amount
 * @property float                           $paid_amount
 * @property float                           $remaining_amount
 * @property string                          $status
 * @property string|null                     $due_date
 * @property string|null                     $note
 * @property int|null                        $created_by
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class StudentTuition extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'student_tuitions';

    protected $fillable = [
        'center_id',
        'student_id',
        'class_id',
        'title',
        'total_amount',
        'paid_amount',
        'remaining_amount',
        'status',
        'due_date',
        'note',
        'created_by',
    ];

    protected $casts = [
        'total_amount'     => 'decimal:2',
        'paid_amount'      => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'due_date'         => 'date:d-m-Y',
        'created_at'       => 'datetime:d-m-Y H:i',
        'updated_at'       => 'datetime:d-m-Y H:i',
    ];

    /**
     * @return BelongsTo<Center, $this>
     */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class, 'center_id');
    }

    /**
     * @return BelongsTo<Student, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id')->withTrashed();
    }

    /**
     * @return BelongsTo<SchoolClass, $this>
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id')->withTrashed();
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    /**
     * @return HasMany<TuitionPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(TuitionPayment::class, 'student_tuition_id');
    }
}

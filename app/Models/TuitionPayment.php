<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int                             $id
 * @property int                             $student_tuition_id
 * @property float                           $amount
 * @property string                          $payment_date
 * @property string                          $payment_method
 * @property string|null                     $transaction_code
 * @property string|null                     $note
 * @property int|null                        $received_by
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class TuitionPayment extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'tuition_payments';

    protected $fillable = [
        'student_tuition_id',
        'amount',
        'payment_date',
        'payment_method',
        'transaction_code',
        'note',
        'received_by',
    ];

    protected $casts = [
        'payment_method' => 'integer',
        'amount'         => 'decimal:0',
        'payment_date'   => 'date:d-m-Y',
        'created_at'     => 'datetime:d-m-Y H:i',
        'updated_at'     => 'datetime:d-m-Y H:i',
    ];

    /**
     * @return BelongsTo<StudentTuition, $this>
     */
    public function studentTuition(): BelongsTo
    {
        return $this->belongsTo(StudentTuition::class, 'student_tuition_id');
    }

    /**
     * @return BelongsTo<Admin, $this>
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'received_by');
    }
}

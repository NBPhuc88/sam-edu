<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'center_id',
        'center_subscription_id',
        'app_trans_id',
        'payment_method',
        'amount',
        'status',
        'zp_trans_id',
        'payload',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'status'         => 'integer',
            'payment_method' => 'integer',
            'amount'         => 'decimal:2',
            'payload'        => 'array',
            'paid_at'        => 'datetime:d-m-Y H:i',
            'created_at'     => 'datetime:d-m-Y H:i',
            'updated_at'     => 'datetime:d-m-Y H:i',
        ];
    }

    public function setStatusAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['status'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['status'] = match ($value) {
                'success'  => \App\Enums\Constant::PAYMENT_STATUS_SUCCESS,
                'failed'   => \App\Enums\Constant::PAYMENT_STATUS_FAILED,
                'refunded' => \App\Enums\Constant::PAYMENT_STATUS_REFUNDED,
                default    => \App\Enums\Constant::PAYMENT_STATUS_PENDING,
            };
        } else {
            $this->attributes['status'] = (int) $value;
        }
    }

    public function setPaymentMethodAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['payment_method'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['payment_method'] = match ($value) {
                'cash'          => \App\Enums\Constant::PAYMENT_METHOD_CASH,
                'bank_transfer' => \App\Enums\Constant::PAYMENT_METHOD_BANK_TRANSFER,
                'momo'          => \App\Enums\Constant::PAYMENT_METHOD_MOMO,
                'zalopay'       => \App\Enums\Constant::PAYMENT_METHOD_ZALOPAY,
                'credit_card'   => \App\Enums\Constant::PAYMENT_METHOD_CREDIT_CARD,
                default         => \App\Enums\Constant::PAYMENT_METHOD_OTHER,
            };
        } else {
            $this->attributes['payment_method'] = (int) $value;
        }
    }

    /**
     * @return BelongsTo<Center, $this>
     */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class);
    }

    /**
     * @return BelongsTo<CenterSubscription, $this>
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(CenterSubscription::class, 'center_subscription_id');
    }
}

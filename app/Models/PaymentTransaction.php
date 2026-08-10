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
            'amount' => 'decimal:2',
            'payload' => 'array',
            'paid_at' => 'datetime',
        ];
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

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CenterSubscription extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'center_id',
        'plan_code',
        'plan_name',
        'price',
        'duration_months',
        'starts_at',
        'ends_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price'           => 'decimal:2',
            'duration_months' => 'integer',
            'starts_at'       => 'datetime',
            'ends_at'         => 'datetime',
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
     * @return HasMany<PaymentTransaction, $this>
     */
    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }
}

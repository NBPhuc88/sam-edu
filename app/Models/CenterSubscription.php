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
        'duration_days',
        'starts_at',
        'ends_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price'         => 'decimal:2',
            'duration_days' => 'integer',
            'starts_at'     => 'datetime:d-m-Y H:i',
            'ends_at'       => 'datetime:d-m-Y H:i',
            'created_at'    => 'datetime:d-m-Y H:i',
            'updated_at'    => 'datetime:d-m-Y H:i',
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

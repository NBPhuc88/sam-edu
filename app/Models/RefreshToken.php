<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class RefreshToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'tokenable_type',
        'tokenable_id',
        'token_hash',
        'device_id',
        'device_name',
        'device_type',
        'ip_address',
        'user_agent',
        'expires_at',
        'revoked_at',
        'last_used_at',
        'replaced_by_token_id',
    ];

    protected function casts(): array
    {
        return [
            'expires_at'   => 'datetime',
            'revoked_at'   => 'datetime',
            'last_used_at' => 'datetime',
        ];
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function tokenable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<RefreshToken, $this>
     */
    public function replacedByToken(): BelongsTo
    {
        return $this->belongsTo(RefreshToken::class, 'replaced_by_token_id');
    }
}

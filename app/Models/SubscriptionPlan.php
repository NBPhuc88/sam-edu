<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int                     $id
 * @property string                  $code
 * @property string                  $name
 * @property string                  $plan_type
 * @property float                   $price
 * @property float|null              $yearly_price
 * @property int                     $duration_days
 * @property int|null                $max_students
 * @property int|null                $max_classes
 * @property array<int, string>|null $features
 * @property array<int, string>|null $allowed_features
 * @property string|null             $badge_text
 * @property bool                    $is_featured
 * @property Carbon|null             $created_at
 * @property Carbon|null             $updated_at
 */
class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'plan_type',
        'price',
        'yearly_price',
        'duration_days',
        'max_students',
        'max_classes',
        'features',
        'allowed_features',
        'badge_text',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'plan_type'        => 'integer',
            'price'            => 'float',
            'yearly_price'     => 'float',
            'duration_days'    => 'integer',
            'max_students'     => 'integer',
            'max_classes'      => 'integer',
            'features'         => 'array',
            'allowed_features' => 'array',
            'is_featured'      => 'boolean',
        ];
    }

    public function setPlanTypeAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['plan_type'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['plan_type'] = match ($value) {
                'trial', 'free'              => \App\Enums\Constant::PLAN_TYPE_FREE,
                'standard', 'basic'          => \App\Enums\Constant::PLAN_TYPE_STANDARD,
                'premium', 'advanced', 'pro' => \App\Enums\Constant::PLAN_TYPE_PREMIUM,
                default                      => \App\Enums\Constant::PLAN_TYPE_FREE,
            };
        } else {
            $this->attributes['plan_type'] = (int) $value;
        }
    }

    public function hasFeature(string $featureCode): bool
    {
        if ($this->plan_type === 'trial' || (int) $this->plan_type === \App\Enums\Constant::PLAN_TYPE_FREE) {
            return true;
        }

        $allowed = $this->allowed_features ?? [];

        return in_array($featureCode, $allowed, true);
    }
}

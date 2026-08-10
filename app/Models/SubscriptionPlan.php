<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $code
 * @property string $name
 * @property float $price
 * @property int $duration_months
 * @property int|null $max_students
 * @property int|null $max_classes
 * @property array<int, string>|null $features
 * @property string|null $badge_text
 * @property bool $is_featured
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'price',
        'duration_months',
        'max_students',
        'max_classes',
        'features',
        'badge_text',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'duration_months' => 'integer',
            'max_students' => 'integer',
            'max_classes' => 'integer',
            'features' => 'array',
            'is_featured' => 'boolean',
        ];
    }
}

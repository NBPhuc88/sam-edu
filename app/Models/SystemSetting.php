<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int         $id
 * @property string      $key
 * @property string|null $value
 * @property string      $group
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'group',
        'description',
    ];

    /**
     * Get a setting value by key with default fallback.
     * @param string  $key
     * @param ?string $default
     */
    public static function getByKey(string $key, ?string $default = null): ?string
    {
        /** @var self|null $setting */
        $setting = static::where('key', $key)->first();

        return $setting ? $setting->value : $default;
    }
}

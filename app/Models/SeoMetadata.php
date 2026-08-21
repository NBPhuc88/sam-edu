<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int         $id
 * @property string      $route_name
 * @property string      $title
 * @property string|null $description
 * @property string|null $keywords
 * @property string|null $og_image
 * @property string|null $canonical_url
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class SeoMetadata extends Model
{
    use HasFactory;

    protected $table = 'seo_metadata';

    protected $fillable = [
        'route_name',
        'title',
        'description',
        'keywords',
        'og_image',
        'canonical_url',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime:d-m-Y H:i',
            'updated_at' => 'datetime:d-m-Y H:i',
        ];
    }

    /**
     * Lấy dữ liệu SEO theo route name hiện tại, với fallback mặc định.
     * @param ?string $routeName
     */
    public static function getByRouteName(?string $routeName): ?self
    {
        if (! $routeName) {
            return null;
        }

        return static::where('route_name', $routeName)->first();
    }
}

<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int         $id
 * @property string      $name
 * @property Carbon      $date
 * @property int         $year
 * @property bool        $is_lunar
 * @property bool        $is_recurring
 * @property string|null $description
 * @property Carbon      $created_at
 * @property Carbon      $updated_at
 */
class Holiday extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'date',
        'year',
        'is_lunar',
        'is_recurring',
        'description',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'date'         => 'date:d-m-Y',
        'year'         => 'integer',
        'is_lunar'     => 'boolean',
        'is_recurring' => 'boolean',
        'created_at'   => 'datetime:d-m-Y H:i',
        'updated_at'   => 'datetime:d-m-Y H:i',
    ];
}

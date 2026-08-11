<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'status',
    ];

    /**
     * @return HasMany<CenterSubject, $this>
     */
    public function centerSubjects(): HasMany
    {
        return $this->hasMany(CenterSubject::class);
    }
}

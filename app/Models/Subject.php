<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int                             $id
 * @property int                             $center_id
 * @property string                          $code
 * @property string                          $name
 * @property string|null                     $description
 * @property int|null                        $total_sessions
 * @property int|null                        $duration_minutes
 * @property float|null                      $tuition_fee
 * @property string                          $status
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Subject extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'center_id',
        'code',
        'name',
        'description',
        'total_sessions',
        'duration_minutes',
        'tuition_fee',
        'status',
    ];

    protected $casts = [
        'total_sessions'   => 'integer',
        'duration_minutes' => 'integer',
        'tuition_fee'      => 'decimal:2',
    ];

    /**
     * @return BelongsTo<Center, $this>
     */
    public function center(): BelongsTo
    {
        return $this->belongsTo(Center::class, 'center_id');
    }

    /**
     * @return HasMany<ClassSubject, $this>
     */
    public function classSubjects(): HasMany
    {
        return $this->hasMany(ClassSubject::class, 'subject_id');
    }
}

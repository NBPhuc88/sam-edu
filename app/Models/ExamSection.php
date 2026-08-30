<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'title',
        'description',
        'skill',
        'order_index',
    ];

    protected function casts(): array
    {
        return [
            'skill'       => 'integer',
            'order_index' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Exam, $this>
     */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * @return HasMany<ExamQuestion, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class, 'section_id')->orderBy('order_index');
    }
}

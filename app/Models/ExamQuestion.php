<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'section_id',
        'code',
        'title',
        'question_type',
        'skill',
        'content',
        'image_url',
        'audio_url',
        'score',
        'options',
        'correct_answer',
        'explanation',
        'metadata',
        'order_index',
    ];

    protected function casts(): array
    {
        return [
            'question_type'  => 'integer',
            'skill'          => 'integer',
            'score'          => 'decimal:2',
            'options'        => 'json',
            'correct_answer' => 'json',
            'metadata'       => 'json',
            'order_index'    => 'integer',
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
     * @return BelongsTo<ExamSection, $this>
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(ExamSection::class, 'section_id');
    }
}

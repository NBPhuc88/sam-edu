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

    public function setQuestionTypeAttribute($value): void
    {
        if (is_numeric($value)) {
            $this->attributes['question_type'] = (int) $value;
        } elseif (is_string($value)) {
            $this->attributes['question_type'] = match ($value) {
                'single_choice'        => \App\Enums\Constant::QUESTION_TYPE_SINGLE_CHOICE,
                'multiple_choice'      => \App\Enums\Constant::QUESTION_TYPE_MULTIPLE_CHOICE,
                'true_false_not_given' => \App\Enums\Constant::QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN,
                'fill_in_blank'        => \App\Enums\Constant::QUESTION_TYPE_FILL_IN_BLANK,
                'drag_drop_cloze'      => \App\Enums\Constant::QUESTION_TYPE_DRAG_DROP_CLOZE,
                'matching'             => \App\Enums\Constant::QUESTION_TYPE_MATCHING,
                'matching_image'       => \App\Enums\Constant::QUESTION_TYPE_MATCHING_IMAGE,
                'matching_sentences'   => \App\Enums\Constant::QUESTION_TYPE_MATCHING_SENTENCES,
                'ordering'             => \App\Enums\Constant::QUESTION_TYPE_ORDERING,
                'diagram_labelling'    => \App\Enums\Constant::QUESTION_TYPE_DIAGRAM_LABELLING,
                'find_mistake'         => \App\Enums\Constant::QUESTION_TYPE_FIND_MISTAKE,
                'essay'                => \App\Enums\Constant::QUESTION_TYPE_ESSAY,
                'audio_record'         => \App\Enums\Constant::QUESTION_TYPE_AUDIO_RECORD,
                'short_answer'         => \App\Enums\Constant::QUESTION_TYPE_SHORT_ANSWER,
                'oral'                 => \App\Enums\Constant::QUESTION_TYPE_ORAL,
                default                => \App\Enums\Constant::QUESTION_TYPE_SINGLE_CHOICE,
            };
        } else {
            $this->attributes['question_type'] = (int) $value;
        }
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

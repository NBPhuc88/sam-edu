<?php

namespace Database\Factories;

use App\Models\ExamQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExamQuestion>
 */
class ExamQuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'exam_id' => \App\Models\Exam::factory(), 'content' => 'Choose A', 'question_type' => 1, 'options' => [['key' => 'A', 'text' => 'First'], ['key' => 'B', 'text' => 'Second']], 'correct_answer' => 'A', 'order_index' => 0,
        ];
    }
}

<?php

namespace App\Http\Requests\Grading;

use Illuminate\Foundation\Http\FormRequest;

class GradeSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'question_grades'                => ['nullable', 'array'],
            'question_grades.*.score_earned' => ['required', 'numeric', 'min:0'],
            'question_grades.*.comment'      => ['nullable', 'string', 'max:2000'],
            'teacher_feedback'               => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'question_grades.*.score_earned.required' => 'Vui lòng nhập điểm cho câu hỏi.',
            'question_grades.*.score_earned.numeric'  => 'Điểm số phải là số.',
            'question_grades.*.score_earned.min'      => 'Điểm số không được âm.',
        ];
    }
}

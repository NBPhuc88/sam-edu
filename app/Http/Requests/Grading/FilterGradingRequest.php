<?php

namespace App\Http\Requests\Grading;

use Illuminate\Foundation\Http\FormRequest;

class FilterGradingRequest extends FormRequest
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
            'class_id'      => ['nullable', 'integer', 'exists:classes,id'],
            'class_exam_id' => ['nullable', 'integer', 'exists:class_exams,id'],
            'status'        => ['nullable', 'string', 'in:all,graded,pending,manual_needed'],
            'search'        => ['nullable', 'string', 'max:100'],
            'page'          => ['nullable', 'integer', 'min:1'],
            'per_page'      => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}

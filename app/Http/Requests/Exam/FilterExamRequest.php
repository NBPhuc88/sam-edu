<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class FilterExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search'       => ['nullable', 'string', 'max:255'],
            'center_id'    => ['nullable', 'integer', 'exists:centers,id'],
            'class_id'     => ['nullable', 'integer', 'exists:classes,id'],
            'subject_id'   => ['nullable', 'integer', 'exists:subjects,id'],
            'exam_type_id' => ['nullable', 'integer', 'exists:exam_types,id'],
            'exam_type'    => ['nullable', 'string', 'max:50'],
            'status'       => ['nullable', 'string', 'max:50'],
            'page'         => ['nullable', 'integer', 'min:1'],
            'per_page'     => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}

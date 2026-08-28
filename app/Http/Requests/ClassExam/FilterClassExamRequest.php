<?php

namespace App\Http\Requests\ClassExam;

use App\Enums\Constant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterClassExamRequest extends FormRequest
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
            'search'    => ['nullable', 'string', 'max:255'],
            'center_id' => ['nullable', 'integer', 'exists:centers,id'],
            'class_id'  => ['nullable', 'integer', 'exists:classes,id'],
            'exam_id'   => ['nullable', 'integer', 'exists:exams,id'],
            'status'    => ['nullable', 'integer', Rule::in(Constant::CLASS_EXAM_STATUSES)],
            'page'      => ['nullable', 'integer', 'min:1'],
            'per_page'  => ['nullable', 'integer', 'min:5', 'max:100'],
        ];
    }
}

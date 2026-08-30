<?php

namespace App\Http\Requests\Exam;

use App\Enums\Constant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'search'     => ['nullable', 'string', 'max:255'],
            'center_id'  => ['nullable', 'integer'],
            'class_id'   => ['nullable', 'integer'],
            'subject_id' => ['nullable', 'integer'],
            'status'     => ['nullable', 'integer', Rule::in(Constant::EXAM_STATUSES)],
            'page'       => ['nullable', 'integer', 'min:1'],
            'per_page'   => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}

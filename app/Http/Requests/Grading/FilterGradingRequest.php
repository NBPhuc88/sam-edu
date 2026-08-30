<?php

namespace App\Http\Requests\Grading;

use App\Enums\Constant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'class_id'      => ['nullable', 'integer'],
            'class_exam_id' => ['nullable', 'integer'],
            'status'        => ['nullable', 'integer', Rule::in(Constant::GRADING_FILTERS)],
            'search'        => ['nullable', 'string', 'max:100'],
            'page'          => ['nullable', 'integer', 'min:1'],
            'per_page'      => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}

<?php

namespace App\Http\Requests\Chat;

use App\Enums\Constant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterChatGroupRequest extends FormRequest
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
            'search'    => ['nullable', 'string', 'max:255'],
            'center_id' => ['nullable', 'integer'],
            'class_id'  => ['nullable', 'integer'],
            'status'    => ['nullable', 'integer', Rule::in(Constant::CLASS_STATUSES)],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
        ];
    }
}

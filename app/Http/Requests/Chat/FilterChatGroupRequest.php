<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

class FilterChatGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            'center_id' => ['nullable', 'integer', 'exists:centers,id'],
            'class_id'  => ['nullable', 'integer', 'exists:classes,id'],
            'status'    => ['nullable', 'string'],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
        ];
    }
}

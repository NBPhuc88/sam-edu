<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

class ReactClassChatMessageRequest extends FormRequest
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
            'emoji' => ['required', 'string', 'max:16'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'emoji.required' => 'Vui lòng chọn biểu tượng cảm xúc.',
            'emoji.max'      => 'Biểu tượng cảm xúc không hợp lệ.',
        ];
    }
}

<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

class SendClassChatMessageRequest extends FormRequest
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
            'message'     => ['required', 'string', 'max:1000'],
            'reply_to_id' => ['nullable', 'integer', 'exists:class_chat_messages,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'message.required'   => 'Vui lòng nhập nội dung tin nhắn.',
            'message.max'        => 'Nội dung tin nhắn không được vượt quá 1000 ký tự.',
            'reply_to_id.exists' => 'Tin nhắn được trả lời không tồn tại hoặc đã bị xóa.',
        ];
    }
}

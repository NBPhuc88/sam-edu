<?php

namespace App\Http\Requests\Home;

use App\Rules\VietnamesePhoneNumber;
use Illuminate\Foundation\Http\FormRequest;

class SubmitContactRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name'   => ['required', 'string', 'max:50'],
            'phone'       => ['required', new VietnamesePhoneNumber()],
            'email'       => ['nullable', 'email', 'max:100'],
            'center_name' => ['nullable', 'string', 'max:100'],
            'message'     => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'full_name.required' => 'Vui lòng nhập họ và tên.',
            'full_name.max'      => 'Họ và tên không được vượt quá 50 ký tự.',
            'phone.required'     => 'Vui lòng nhập số điện thoại liên hệ.',
            'email.email'        => 'Địa chỉ email không đúng định dạng.',
            'email.max'          => 'Địa chỉ email không được vượt quá 100 ký tự.',
            'center_name.max'    => 'Tên trung tâm không được vượt quá 100 ký tự.',
            'message.max'        => 'Nội dung tin nhắn không được vượt quá 2000 ký tự.',
        ];
    }
}

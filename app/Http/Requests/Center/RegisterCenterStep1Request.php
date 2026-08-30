<?php

namespace App\Http\Requests\Center;

use App\Enums\Constant;
use App\Rules\VietnamesePhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterCenterStep1Request extends FormRequest
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
            'name'                 => ['required', 'string', 'max:100'],
            'phone'                => ['required', new VietnamesePhoneNumber()],
            'email'                => ['required', 'email', 'max:100'],
            'address'              => ['nullable', 'string', 'max:255'],
            'subscription_plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
            'payment_method'       => ['nullable', 'integer', Rule::in(Constant::PAYMENT_METHODS)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required'                 => 'Vui lòng nhập tên trung tâm.',
            'name.max'                      => 'Tên trung tâm không được vượt quá 100 ký tự.',
            'phone.required'                => 'Vui lòng nhập số điện thoại liên hệ.',
            'email.required'                => 'Vui lòng nhập địa chỉ email.',
            'email.email'                   => 'Địa chỉ email không đúng định dạng.',
            'email.max'                     => 'Địa chỉ email không được vượt quá 100 ký tự.',
            'subscription_plan_id.required' => 'Vui lòng chọn gói dịch vụ.',
            'subscription_plan_id.exists'   => 'Gói dịch vụ không tồn tại trên hệ thống.',
        ];
    }
}

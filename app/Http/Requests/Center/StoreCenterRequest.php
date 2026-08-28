<?php

namespace App\Http\Requests\Center;

use App\Enums\Constant;
use App\Rules\VietnamesePhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCenterRequest extends FormRequest
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
            'code'              => ['nullable', 'string', 'max:20', 'regex:/^[A-Za-z0-9_-]+$/', 'unique:centers,code'],
            'name'              => ['required', 'string', 'max:100'],
            'phone'             => ['nullable', new VietnamesePhoneNumber()],
            'email'             => ['nullable', 'email', 'max:100'],
            'address'           => ['nullable', 'string', 'max:255'],
            'status'            => ['required', 'integer', Rule::in(Constant::CENTER_STATUSES)],
            'subscription_plan' => ['required', 'integer', Rule::in(Constant::PLAN_TYPES)],
            'expires_at'        => ['nullable', 'date'],
            'max_students'      => ['nullable', 'integer', 'min:0'],
            'max_classes'       => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.max'                   => 'Mã trung tâm không được vượt quá 20 ký tự.',
            'code.regex'                 => 'Mã trung tâm chỉ được chứa chữ cái, chữ số, gạch ngang hoặc gạch dưới.',
            'code.unique'                => 'Mã trung tâm này đã tồn tại trên hệ thống.',
            'name.required'              => 'Vui lòng nhập tên trung tâm.',
            'name.max'                   => 'Tên trung tâm không được vượt quá 100 ký tự.',
            'email.email'                => 'Địa chỉ email không hợp lệ.',
            'email.max'                  => 'Địa chỉ email không được vượt quá 100 ký tự.',
            'status.required'            => 'Vui lòng chọn trạng thái trung tâm.',
            'subscription_plan.required' => 'Vui lòng chọn gói dịch vụ phần mềm.',
        ];
    }
}

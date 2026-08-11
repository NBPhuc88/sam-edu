<?php

namespace App\Http\Requests\Center;

use Illuminate\Foundation\Http\FormRequest;

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
            'code'              => ['nullable', 'string', 'max:50', 'unique:centers,code'],
            'name'              => ['required', 'string', 'max:255'],
            'username'          => ['nullable', 'string', 'max:100', 'unique:centers,username'],
            'password'          => ['nullable', 'string', 'min:6'],
            'phone'             => ['nullable', 'string', 'max:30'],
            'email'             => ['nullable', 'email', 'max:255'],
            'address'           => ['nullable', 'string'],
            'status'            => ['required', 'in:active,inactive,expired,suspended'],
            'subscription_plan' => ['required', 'string', 'max:100'],
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
            'code.unique'                => 'Mã trung tâm này đã tồn tại trên hệ thống.',
            'name.required'              => 'Vui lòng nhập tên trung tâm.',
            'username.unique'            => 'Tên đăng nhập trung tâm này đã tồn tại.',
            'password.min'               => 'Mật khẩu tối thiểu 6 ký tự.',
            'email.email'                => 'Địa chỉ email không hợp lệ.',
            'status.required'            => 'Vui lòng chọn trạng thái trung tâm.',
            'subscription_plan.required' => 'Vui lòng chọn gói dịch vụ phần mềm.',
        ];
    }
}

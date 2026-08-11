<?php

namespace App\Http\Requests\Center;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCenterRequest extends FormRequest
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
        /** @var int|string $centerId */
        $centerId = $this->route('center') ?? $this->route('id') ?? $this->input('id');

        return [
            'code'              => ['sometimes', 'required', 'string', 'max:50', Rule::unique('centers', 'code')->ignore($centerId)],
            'name'              => ['sometimes', 'required', 'string', 'max:255'],
            'username'          => ['sometimes', 'nullable', 'string', 'max:100', Rule::unique('centers', 'username')->ignore($centerId)],
            'password'          => ['sometimes', 'nullable', 'string', 'min:6'],
            'phone'             => ['sometimes', 'nullable', 'string', 'max:30'],
            'email'             => ['sometimes', 'nullable', 'email', 'max:255'],
            'address'           => ['sometimes', 'nullable', 'string'],
            'status'            => ['sometimes', 'required', 'in:active,inactive,expired,suspended'],
            'subscription_plan' => ['sometimes', 'required', 'string', 'max:100'],
            'expires_at'        => ['sometimes', 'nullable', 'date'],
            'max_students'      => ['sometimes', 'nullable', 'integer', 'min:0'],
            'max_classes'       => ['sometimes', 'nullable', 'integer', 'min:0'],
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

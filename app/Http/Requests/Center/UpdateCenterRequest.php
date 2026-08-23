<?php

namespace App\Http\Requests\Center;

use App\Rules\VietnamesePhoneNumber;
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
            'code'              => ['sometimes', 'required', 'string', 'max:20', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('centers', 'code')->ignore($centerId)],
            'name'              => ['sometimes', 'required', 'string', 'max:100'],
            'phone'             => ['sometimes', 'nullable', new VietnamesePhoneNumber()],
            'email'             => ['sometimes', 'nullable', 'email', 'max:100'],
            'address'           => ['sometimes', 'nullable', 'string', 'max:255'],
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

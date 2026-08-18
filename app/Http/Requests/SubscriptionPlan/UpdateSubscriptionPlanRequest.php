<?php

namespace App\Http\Requests\SubscriptionPlan;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubscriptionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $id = $this->route('id') ?? $this->route('plan');

        return [
            'code'          => ['nullable', 'string', 'max:50', Rule::unique('subscription_plans', 'code')->ignore($id)],
            'name'          => ['required', 'string', 'max:255'],
            'price'         => ['required', 'numeric', 'min:0'],
            'yearly_price'  => ['nullable', 'numeric', 'min:0'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'max_students'  => ['nullable', 'integer', 'min:1'],
            'max_classes'   => ['nullable', 'integer', 'min:1'],
            'features'      => ['nullable', 'array'],
            'features.*'    => ['nullable', 'string', 'max:255'],
            'badge_text'    => ['nullable', 'string', 'max:50'],
            'is_featured'   => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.unique'            => 'Mã gói cước đã tồn tại trong hệ thống.',
            'name.required'          => 'Vui lòng nhập tên gói cước.',
            'price.required'         => 'Vui lòng nhập giá theo tháng/chu kỳ mặc định.',
            'price.numeric'          => 'Giá cước phải là chữ số hợp lệ.',
            'price.min'              => 'Giá cước không được nhỏ hơn 0.',
            'yearly_price.numeric'   => 'Giá theo năm phải là chữ số hợp lệ.',
            'yearly_price.min'       => 'Giá theo năm không được nhỏ hơn 0.',
            'duration_days.required' => 'Vui lòng nhập số ngày thời hạn gói.',
            'duration_days.integer'  => 'Số ngày thời hạn phải là số nguyên.',
            'duration_days.min'      => 'Thời hạn gói tối thiểu là 1 ngày.',
        ];
    }
}

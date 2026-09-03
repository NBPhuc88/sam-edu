<?php

namespace App\Http\Requests\Center;

use App\Enums\Constant;
use App\Models\Admin;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateCenterSubscriptionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        return $admin ? $admin->isSuperAdmin() : false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'plan_id'       => ['required', 'integer', 'exists:subscription_plans,id'],
            'price'         => ['required', 'numeric', 'min:0'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'starts_at'     => ['required', 'date'],
            'ends_at'       => ['required', 'date', 'after_or_equal:starts_at'],
            'status'        => ['required', 'integer', Rule::in(Constant::SUBSCRIPTION_STATUSES)],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plan_id.required'       => 'Vui lòng chọn gói cước dịch vụ.',
            'plan_id.exists'         => 'Gói cước được chọn không hợp lệ.',
            'price.required'         => 'Vui lòng nhập giá tiền.',
            'price.numeric'          => 'Giá tiền phải là số hợp lệ.',
            'duration_days.required' => 'Vui lòng nhập thời hạn gói cước.',
            'duration_days.integer'  => 'Thời hạn phải là số ngày hợp lệ.',
            'starts_at.required'     => 'Vui lòng chọn ngày bắt đầu.',
            'ends_at.required'       => 'Vui lòng chọn ngày kết thúc.',
            'ends_at.after_or_equal' => 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
            'status.required'        => 'Vui lòng chọn trạng thái gói cước.',
            'status.in'              => 'Trạng thái gói cước không hợp lệ.',
        ];
    }
}

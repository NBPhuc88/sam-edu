<?php

namespace App\Http\Requests\Tuition;

use Illuminate\Foundation\Http\FormRequest;

class StoreTuitionPaymentRequest extends FormRequest
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
            'amount'           => ['required', 'numeric', 'min:1000'],
            'payment_date'     => ['required', 'date'],
            'payment_method'   => ['required', 'string', 'in:cash,bank_transfer,momo,zalopay,credit_card,other'],
            'transaction_code' => ['nullable', 'string', 'max:100'],
            'note'             => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'amount.required'         => 'Vui lòng nhập số tiền đóng cho đợt này.',
            'amount.min'              => 'Số tiền đóng tối thiểu là 1.000đ.',
            'payment_date.required'   => 'Vui lòng chọn ngày đóng tiền.',
            'payment_method.required' => 'Vui lòng chọn hình thức đóng tiền.',
        ];
    }
}

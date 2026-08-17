<?php

namespace App\Http\Requests\Center;

use Illuminate\Foundation\Http\FormRequest;

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
            'name'              => ['required', 'string', 'max:255'],
            'phone'             => ['required', 'string', 'max:30'],
            'email'             => ['required', 'email', 'max:255'],
            'address'           => ['nullable', 'string', 'max:500'],
            'subscription_plan' => ['required', 'string', 'in:trial_14d,monthly,yearly'],
            'payment_method'    => ['nullable', 'string', 'in:zalopay,bank_transfer,momo,vnpay'],
        ];
    }
}

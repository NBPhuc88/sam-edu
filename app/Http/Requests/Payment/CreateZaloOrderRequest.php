<?php

namespace App\Http\Requests\Payment;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateZaloOrderRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'center_id'       => 'required|exists:centers,id',
            'plan_id'         => 'required|integer|exists:subscription_plans,id',
            'plan_name'       => 'required|string',
            'amount'          => 'required|numeric|min:10000',
            'duration_days'   => 'nullable|integer|min:1',
            'duration_months' => 'nullable|integer|min:1',
            'redirect_url'    => 'nullable|url',
        ];
    }
}

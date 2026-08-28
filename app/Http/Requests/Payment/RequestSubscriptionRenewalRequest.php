<?php

namespace App\Http\Requests\Payment;

use App\Models\Admin;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class RequestSubscriptionRenewalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if (! Auth::guard('admin')->check()) {
            return false;
        }

        /** @var Admin|null $admin */
        $admin = Auth::guard('admin')->user();

        if (! $admin || ((int) $admin->role !== \App\Enums\Constant::ROLE_ADMIN && $admin->role !== 'admin')) {
            return false;
        }

        $centerId = (int) $this->input('center_id');

        if ($centerId && $admin->assignedCenterId() !== $centerId && ! $admin->centers->contains($centerId)) {
            return false;
        }

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
            'center_id'     => ['required', 'integer', 'exists:centers,id'],
            'plan_code'     => ['required', 'string', 'exists:subscription_plans,code'],
            'duration_type' => ['nullable', 'string', 'in:monthly,yearly'],
            'note'          => ['nullable', 'string', 'max:1000'],
        ];
    }
}

<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdminRequest extends FormRequest
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
            'username'     => ['required', 'string', 'max:50', 'unique:admins,username'],
            'full_name'    => ['required', 'string', 'max:100'],
            'email'        => ['nullable', 'email', 'max:100', 'unique:admins,email'],
            'phone'        => ['nullable', 'string', 'max:20'],
            'password'     => ['required', 'string', 'min:6'],
            'role'         => ['required', Rule::in(['super_admin', 'admin'])],
            'center_ids'   => ['array'],
            'center_ids.*' => ['exists:centers,id'],
        ];
    }
}

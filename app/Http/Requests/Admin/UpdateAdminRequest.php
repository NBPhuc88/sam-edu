<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminRequest extends FormRequest
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
        $id = $this->route('id') ?? $this->route('admin');

        return [
            'full_name'    => ['required', 'string', 'max:100'],
            'email'        => ['nullable', 'email', 'max:100', Rule::unique('admins', 'email')->ignore($id)],
            'phone'        => ['nullable', 'string', 'max:20'],
            'password'     => ['nullable', 'string', 'min:6'],
            'role'         => ['required', Rule::in(['super_admin', 'admin'])],
            'center_ids'   => ['array'],
            'center_ids.*' => ['exists:centers,id'],
        ];
    }
}

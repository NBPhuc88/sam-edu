<?php

namespace App\Http\Requests\Permission;

use App\Enums\Constant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRolePermissionsRequest extends FormRequest
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
            'role'          => ['required', 'integer', Rule::in(Constant::ROLE_PERMISSION_ROLES)],
            'permissions'   => ['present', 'array'],
            'permissions.*' => ['string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.required'       => 'Vui lòng chọn vai trò cần phân quyền.',
            'role.in'             => 'Vai trò không hợp lệ.',
            'permissions.present' => 'Dữ liệu phân quyền không hợp lệ.',
        ];
    }
}

<?php

namespace App\Http\Requests\Admin;

use App\Enums\Constant;
use App\Rules\VietnamesePhoneNumber;
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
            'username'     => ['required', 'string', 'min:6', 'max:19', 'regex:/^[a-zA-Z0-9._-]+$/', 'unique:admins,username'],
            'full_name'    => ['required', 'string', 'max:50'],
            'email'        => ['nullable', 'email', 'max:100', 'unique:admins,email'],
            'phone'        => ['nullable', new VietnamesePhoneNumber()],
            'password'     => ['required', 'string', 'min:5', 'max:20'],
            'role'         => ['required', 'integer', Rule::in(Constant::ADMIN_ROLES)],
            'center_id'    => ['nullable', 'required_if:role,' . Constant::ROLE_ADMIN, 'exists:centers,id'],
            'center_ids'   => ['nullable', 'array'],
            'center_ids.*' => ['exists:centers,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.required'     => 'Vui lòng nhập tên đăng nhập.',
            'username.min'          => 'Tên đăng nhập phải có ít nhất 6 ký tự.',
            'username.max'          => 'Tên đăng nhập không được vượt quá 19 ký tự.',
            'username.regex'        => 'Tên đăng nhập chỉ được chứa chữ cái, chữ số, dấu chấm, gạch ngang hoặc gạch dưới.',
            'username.unique'       => 'Tên đăng nhập này đã được sử dụng.',
            'full_name.required'    => 'Vui lòng nhập họ và tên.',
            'full_name.max'         => 'Họ và tên không được vượt quá 50 ký tự.',
            'email.email'           => 'Địa chỉ email không đúng định dạng.',
            'email.max'             => 'Email không được vượt quá 100 ký tự.',
            'email.unique'          => 'Địa chỉ email này đã được sử dụng.',
            'password.required'     => 'Vui lòng nhập mật khẩu.',
            'password.min'          => 'Mật khẩu phải từ 5 ký tự trở lên.',
            'password.max'          => 'Mật khẩu không được vượt quá 20 ký tự.',
            'role.required'         => 'Vui lòng chọn vai trò quản trị.',
            'role.integer'          => 'Vai trò quản trị phải là số nguyên hợp lệ.',
            'role.in'               => 'Vai trò quản trị không hợp lệ.',
            'center_id.required_if' => 'Quản trị viên cần được phân công vào 1 trung tâm.',
        ];
    }
}

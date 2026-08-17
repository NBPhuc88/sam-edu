<?php

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeacherRequest extends FormRequest
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
            'center_id'    => ['required', 'integer', 'exists:centers,id'],
            'full_name'    => ['required', 'string', 'max:255'],
            'username'     => ['required', 'string', 'max:100', 'unique:teachers,username'],
            'email'        => ['nullable', 'email', 'max:255', 'unique:teachers,email'],
            'password'     => ['nullable', 'string', 'min:6'],
            'phone'        => ['nullable', 'string', 'max:30'],
            'teacher_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('teachers', 'teacher_code')->where(function ($query) {
                    return $query->where('center_id', $this->input('center_id'));
                }),
            ],
            'date_of_birth'  => ['nullable', 'date'],
            'gender'         => ['nullable', 'string', 'in:male,female,other'],
            'hire_date'      => ['nullable', 'date'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'status'         => ['nullable', 'string', 'in:active,inactive,locked'],
            'note'           => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required'  => 'Vui lòng chọn Trung tâm đào tạo.',
            'center_id.exists'    => 'Trung tâm đã chọn không tồn tại.',
            'full_name.required'  => 'Vui lòng nhập họ và tên giáo viên.',
            'username.required'   => 'Vui lòng nhập tên đăng nhập của giáo viên.',
            'username.unique'     => 'Tên đăng nhập này đã được sử dụng.',
            'email.email'         => 'Địa chỉ email không đúng định dạng.',
            'email.unique'        => 'Địa chỉ email này đã được sử dụng.',
            'password.min'        => 'Mật khẩu phải có ít nhất 6 ký tự.',
            'teacher_code.unique' => 'Mã giáo viên đã tồn tại trong trung tâm này.',
        ];
    }
}

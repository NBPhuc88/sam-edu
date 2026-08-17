<?php

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherRequest extends FormRequest
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
        $teacherId = $this->route('id');

        return [
            'center_id' => ['sometimes', 'required', 'integer', 'exists:centers,id'],
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'username'  => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('teachers', 'username')->ignore($teacherId),
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('teachers', 'email')->ignore($teacherId),
            ],
            'password'     => ['nullable', 'string', 'min:6'],
            'phone'        => ['nullable', 'string', 'max:30'],
            'teacher_code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('teachers', 'teacher_code')
                    ->where(function ($query) {
                        return $query->where('center_id', $this->input('center_id'));
                    })
                    ->ignore($teacherId),
            ],
            'date_of_birth'  => ['nullable', 'date'],
            'gender'         => ['nullable', 'string', 'in:male,female,other'],
            'hire_date'      => ['nullable', 'date'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'status'         => ['sometimes', 'required', 'string', 'in:active,inactive,locked'],
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
            'full_name.required'  => 'Vui lòng nhập họ và tên giáo viên.',
            'username.required'   => 'Vui lòng nhập tên đăng nhập.',
            'username.unique'     => 'Tên đăng nhập này đã được sử dụng.',
            'email.email'         => 'Địa chỉ email không đúng định dạng.',
            'email.unique'        => 'Địa chỉ email này đã được sử dụng.',
            'password.min'        => 'Mật khẩu phải có ít nhất 6 ký tự.',
            'teacher_code.unique' => 'Mã giáo viên đã tồn tại trong trung tâm này.',
        ];
    }
}

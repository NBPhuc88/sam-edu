<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
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
        $studentId = $this->route('id');

        return [
            'center_id' => ['sometimes', 'required', 'integer', 'exists:centers,id'],
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'username'  => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('students', 'username')->ignore($studentId),
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('students', 'email')->ignore($studentId),
            ],
            'password'     => ['nullable', 'string', 'min:6'],
            'phone'        => ['nullable', 'string', 'max:30'],
            'student_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('students', 'student_code')
                    ->where(function ($query) {
                        return $query->where('center_id', $this->input('center_id'));
                    })
                    ->ignore($studentId),
            ],
            'date_of_birth'       => ['nullable', 'date'],
            'gender'              => ['nullable', 'string', 'in:male,female,other'],
            'address'             => ['nullable', 'string'],
            'parent_name'         => ['nullable', 'string', 'max:255'],
            'parent_phone'        => ['nullable', 'string', 'max:30'],
            'parent_relationship' => ['nullable', 'string', 'max:50'],
            'admission_date'      => ['nullable', 'date'],
            'status'              => ['sometimes', 'required', 'string', 'in:active,inactive,locked,graduated,suspended'],
            'note'                => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required'  => 'Vui lòng chọn Trung tâm đào tạo.',
            'full_name.required'  => 'Vui lòng nhập họ và tên học sinh.',
            'username.required'   => 'Vui lòng nhập tên đăng nhập.',
            'username.unique'     => 'Tên đăng nhập này đã được sử dụng.',
            'email.email'         => 'Địa chỉ email không đúng định dạng.',
            'email.unique'        => 'Địa chỉ email này đã được sử dụng.',
            'password.min'        => 'Mật khẩu phải có ít nhất 6 ký tự.',
            'student_code.unique' => 'Mã học sinh đã tồn tại trong trung tâm này.',
        ];
    }
}

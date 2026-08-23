<?php

namespace App\Http\Requests\Student;

use App\Rules\VietnamesePhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('center_id') && $this->input('center_id') !== null && $this->input('center_id') !== '') {
            $this->merge([
                'center_id' => (int) $this->input('center_id'),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $studentId = $this->route('id');

        return [
            'center_id' => ['sometimes', 'required', 'integer', 'exists:centers,id'],
            'full_name' => ['sometimes', 'required', 'string', 'max:50'],
            'username'  => [
                'nullable',
                'string',
                'min:6',
                'max:19',
                'regex:/^[a-zA-Z0-9._-]+$/',
                Rule::unique('students', 'username')->ignore($studentId),
            ],
            'email' => [
                'nullable',
                'email',
                'max:100',
                Rule::unique('students', 'email')->ignore($studentId),
            ],
            'password'     => ['nullable', 'string', 'min:5', 'max:20'],
            'phone'        => ['nullable', new VietnamesePhoneNumber()],
            'student_code' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('students', 'student_code')
                    ->where(function ($query) use ($studentId) {
                        $centerId = $this->input('center_id') ?? \App\Models\Student::where('id', $studentId)->value('center_id');

                        return $query->where('center_id', $centerId);
                    })
                    ->ignore($studentId),
            ],
            'date_of_birth'       => ['nullable', 'date', 'before:today'],
            'gender'              => ['nullable', 'string', 'in:male,female,other'],
            'address'             => ['nullable', 'string', 'max:255'],
            'parent_name'         => ['nullable', 'string', 'max:50'],
            'parent_phone'        => ['nullable', new VietnamesePhoneNumber()],
            'parent_relationship' => ['nullable', 'string', 'max:50'],
            'admission_date'      => ['nullable', 'date'],
            'status'              => ['sometimes', 'required'],
            'note'                => ['nullable', 'string'],
            'class_ids'           => ['nullable', 'array'],
            'class_ids.*'         => ['integer', 'exists:classes,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required'   => 'Vui lòng chọn Trung tâm đào tạo.',
            'center_id.exists'     => 'Trung tâm đã chọn không tồn tại.',
            'full_name.required'   => 'Vui lòng nhập họ và tên học sinh.',
            'full_name.max'        => 'Họ và tên không được vượt quá 50 ký tự.',
            'parent_name.max'      => 'Tên phụ huynh không được vượt quá 50 ký tự.',
            'username.min'         => 'Tên đăng nhập phải có ít nhất 6 ký tự.',
            'username.max'         => 'Tên đăng nhập không được vượt quá 19 ký tự.',
            'username.regex'       => 'Tên đăng nhập chỉ được chứa chữ cái, chữ số, dấu chấm, gạch ngang hoặc gạch dưới.',
            'username.unique'      => 'Tên đăng nhập này đã được sử dụng.',
            'email.email'          => 'Địa chỉ email không đúng định dạng.',
            'email.max'            => 'Email không được vượt quá 100 ký tự.',
            'email.unique'         => 'Địa chỉ email này đã được sử dụng.',
            'password.min'         => 'Mật khẩu phải từ 5 ký tự trở lên.',
            'password.max'         => 'Mật khẩu không được vượt quá 20 ký tự.',
            'student_code.max'     => 'Mã học sinh không được vượt quá 20 ký tự.',
            'student_code.regex'   => 'Mã học sinh chỉ được chứa ký tự chữ số và gạch ngang.',
            'student_code.unique'  => 'Mã học sinh đã tồn tại trong trung tâm này.',
            'date_of_birth.before' => 'Ngày sinh không hợp lệ (phải trước ngày hôm nay).',
        ];
    }
}

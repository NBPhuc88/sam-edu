<?php

namespace App\Http\Requests\Teacher;

use App\Enums\Constant;
use App\Rules\VietnamesePhoneNumber;
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
            'full_name'    => ['required', 'string', 'max:50'],
            'username'     => ['required', 'string', 'min:6', 'max:19', 'regex:/^[a-zA-Z0-9._-]+$/', 'unique:teachers,username'],
            'email'        => ['nullable', 'email', 'max:100', 'unique:teachers,email'],
            'password'     => ['nullable', 'string', 'min:5', 'max:20'],
            'phone'        => ['nullable', new VietnamesePhoneNumber()],
            'teacher_code' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('teachers', 'teacher_code')->where(function ($query) {
                    return $query
                        ->where('center_id', $this->input('center_id'))
                        ->whereNull('deleted_at');
                }),
            ],
            'date_of_birth'  => ['nullable', 'date', 'before:today'],
            'gender'         => ['nullable', 'integer', Rule::in(Constant::GENDERS)],
            'hire_date'      => ['nullable', 'date'],
            'specialization' => ['nullable', 'string', 'max:100'],
            'status'         => ['nullable', 'integer', Rule::in(Constant::TEACHER_STATUSES)],
            'note'           => ['nullable', 'string'],
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
            'full_name.required'   => 'Vui lòng nhập họ và tên giáo viên.',
            'full_name.max'        => 'Họ và tên không được vượt quá 50 ký tự.',
            'username.required'    => 'Vui lòng nhập tên đăng nhập của giáo viên.',
            'username.min'         => 'Tên đăng nhập phải có ít nhất 6 ký tự.',
            'username.max'         => 'Tên đăng nhập không được vượt quá 19 ký tự.',
            'username.regex'       => 'Tên đăng nhập chỉ được chứa chữ cái, chữ số, dấu chấm, gạch ngang hoặc gạch dưới.',
            'username.unique'      => 'Tên đăng nhập này đã được sử dụng.',
            'email.email'          => 'Địa chỉ email không đúng định dạng.',
            'email.max'            => 'Email không được vượt quá 100 ký tự.',
            'email.unique'         => 'Địa chỉ email này đã được sử dụng.',
            'password.min'         => 'Mật khẩu phải từ 5 ký tự trở lên.',
            'password.max'         => 'Mật khẩu không được vượt quá 20 ký tự.',
            'teacher_code.max'     => 'Mã giáo viên không được vượt quá 20 ký tự.',
            'teacher_code.regex'   => 'Mã giáo viên chỉ được chứa ký tự chữ số và gạch ngang.',
            'teacher_code.unique'  => 'Mã giáo viên đã tồn tại trong trung tâm này.',
            'date_of_birth.before' => 'Ngày sinh không hợp lệ (phải trước ngày hôm nay).',
        ];
    }
}

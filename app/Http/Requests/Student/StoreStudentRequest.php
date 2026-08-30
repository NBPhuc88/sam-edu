<?php

namespace App\Http\Requests\Student;

use App\Enums\Constant;
use App\Rules\VietnamesePhoneNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        /** @var \App\Models\Admin|null $user */
        $user = Auth::guard('admin')->user();

        if (! $this->filled('center_id') && $user) {
            if (! $user->isSuperAdmin()) {
                $centerId = $user->centers()->value('centers.id');

                if ($centerId) {
                    $this->merge(['center_id' => (int) $centerId]);
                }
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'center_id'    => ['required', 'integer', 'exists:centers,id'],
            'full_name'    => ['required', 'string', 'max:50'],
            'username'     => ['nullable', 'string', 'min:6', 'max:19', 'regex:/^[a-zA-Z0-9._-]+$/', 'unique:students,username'],
            'email'        => ['nullable', 'email', 'max:100', 'unique:students,email'],
            'password'     => ['nullable', 'string', 'min:5', 'max:20'],
            'phone'        => ['nullable', new VietnamesePhoneNumber()],
            'student_code' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('students', 'student_code')->whereNull('deleted_at'),
            ],
            'date_of_birth'       => ['nullable', 'date', 'before:today'],
            'gender'              => ['nullable', 'integer', Rule::in(Constant::GENDERS)],
            'address'             => ['nullable', 'string', 'max:255'],
            'parent_name'         => ['nullable', 'string', 'max:50'],
            'parent_phone'        => ['nullable', new VietnamesePhoneNumber()],
            'parent_relationship' => ['nullable', 'string', 'max:50'],
            'admission_date'      => ['nullable', 'date'],
            'status'              => ['nullable', 'integer', Rule::in(Constant::STUDENT_STATUSES)],
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

<?php

namespace App\Http\Requests\Class;

use Illuminate\Foundation\Http\FormRequest;

class AddStudentsToClassRequest extends FormRequest
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
            'student_ids'   => ['required', 'array', 'min:1'],
            'student_ids.*' => ['integer', 'exists:students,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'student_ids.required' => 'Vui lòng chọn ít nhất một học sinh.',
            'student_ids.array'    => 'Danh sách học sinh không hợp lệ.',
            'student_ids.min'      => 'Vui lòng chọn ít nhất một học sinh.',
            'student_ids.*.exists' => 'Học sinh đã chọn không tồn tại.',
        ];
    }
}

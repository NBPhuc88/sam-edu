<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class AssignStudentClassesRequest extends FormRequest
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
            'class_ids'      => ['nullable', 'array'],
            'class_ids.*'    => ['integer', 'exists:classes,id'],
            'create_tuition' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'class_ids.array'     => 'Danh sách lớp học không hợp lệ.',
            'class_ids.*.integer' => 'Mã lớp học không hợp lệ.',
            'class_ids.*.exists'  => 'Lớp học đã chọn không tồn tại.',
        ];
    }
}

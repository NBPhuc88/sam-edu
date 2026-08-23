<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class BulkAssignClassStudentsRequest extends FormRequest
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
            'class_id'      => ['required', 'integer', 'exists:classes,id'],
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
            'class_id.required'    => 'Vui lòng chọn lớp học cần phân.',
            'class_id.integer'     => 'Mã lớp học không hợp lệ.',
            'class_id.exists'      => 'Lớp học đã chọn không tồn tại.',
        ];
    }
}

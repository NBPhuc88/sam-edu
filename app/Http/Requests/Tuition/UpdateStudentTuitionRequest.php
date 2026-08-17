<?php

namespace App\Http\Requests\Tuition;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentTuitionRequest extends FormRequest
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
            'center_id'    => ['sometimes', 'required', 'integer', 'exists:centers,id'],
            'student_id'   => ['sometimes', 'required', 'integer', 'exists:students,id'],
            'class_id'     => ['sometimes', 'required', 'integer', 'exists:classes,id'],
            'title'        => ['nullable', 'string', 'max:255'],
            'total_amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'due_date'     => ['nullable', 'date'],
            'note'         => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required'    => 'Vui lòng chọn Trung tâm đào tạo.',
            'student_id.required'   => 'Vui lòng chọn học sinh.',
            'class_id.required'     => 'Vui lòng chọn lớp học.',
            'total_amount.required' => 'Vui lòng nhập tổng số tiền học phí cần đóng.',
            'total_amount.min'      => 'Số tiền học phí không thể âm.',
        ];
    }
}

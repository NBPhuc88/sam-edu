<?php

namespace App\Http\Requests\Class;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSchoolClassRequest extends FormRequest
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
            'center_id' => ['required', 'integer', 'exists:centers,id'],
            'name'      => ['required', 'string', 'max:100'],
            'code'      => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('classes', 'code')->whereNull('deleted_at'),
            ],
            'description'           => ['nullable', 'string', 'max:1000'],
            'max_students'          => ['nullable', 'integer', 'min:1', 'max:500'],
            'start_date'            => ['nullable', 'date'],
            'end_date'              => ['nullable', 'date', 'after_or_equal:start_date'],
            'status'                => ['nullable'],
            'subjects'              => ['nullable', 'array'],
            'subjects.*.subject_id' => ['required_with:subjects', 'integer', 'exists:subjects,id'],
            'subjects.*.teacher_id' => ['required_with:subjects', 'integer', 'exists:teachers,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required'             => 'Vui lòng chọn Trung tâm đào tạo.',
            'center_id.exists'               => 'Trung tâm đã chọn không tồn tại.',
            'name.required'                  => 'Vui lòng nhập tên lớp học.',
            'name.max'                       => 'Tên lớp học không được vượt quá 100 ký tự.',
            'code.max'                       => 'Mã lớp học không được vượt quá 20 ký tự.',
            'code.regex'                     => 'Mã lớp học chỉ được chứa ký tự chữ số và gạch ngang.',
            'code.unique'                    => 'Mã lớp học đã tồn tại trong trung tâm này.',
            'max_students.min'               => 'Sĩ số tối đa phải từ 1 học sinh trở lên.',
            'max_students.max'               => 'Sĩ số tối đa không được vượt quá 500 học sinh.',
            'end_date.after_or_equal'        => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'subjects.*.subject_id.required' => 'Vui lòng chọn môn học.',
            'subjects.*.teacher_id.required' => 'Vui lòng chọn giáo viên phụ trách cho môn học.',
        ];
    }
}

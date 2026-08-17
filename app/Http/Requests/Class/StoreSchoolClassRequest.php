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
            'name'      => ['required', 'string', 'max:255'],
            'code'      => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('classes', 'code')->where(function ($query) {
                    return $query->where('center_id', $this->input('center_id'));
                }),
            ],
            'description'           => ['nullable', 'string'],
            'max_students'          => ['nullable', 'integer', 'min:1'],
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
            'code.unique'                    => 'Mã lớp học đã tồn tại trong trung tâm này.',
            'end_date.after_or_equal'        => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'subjects.*.subject_id.required' => 'Vui lòng chọn môn học.',
            'subjects.*.teacher_id.required' => 'Vui lòng chọn giáo viên phụ trách cho môn học.',
        ];
    }
}

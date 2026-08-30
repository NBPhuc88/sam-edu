<?php

namespace App\Http\Requests\Class;

use App\Enums\Constant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

use Illuminate\Validation\Validator;

class UpdateSchoolClassRequest extends FormRequest
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
        $classId = $this->route('id');

        return [
            'center_id' => ['sometimes', 'required', 'integer', 'exists:centers,id'],
            'name'      => ['sometimes', 'required', 'string', 'max:100'],
            'code'      => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Za-z0-9_-]+$/',
                Rule::unique('classes', 'code')
                    ->whereNull('deleted_at')
                    ->ignore($classId),
            ],
            'description'            => ['nullable', 'string', 'max:1000'],
            'max_students'           => ['nullable', 'integer', 'min:1', 'max:500'],
            'start_date'             => ['nullable', 'date'],
            'end_date'               => ['nullable', 'date', 'after_or_equal:start_date'],
            'status'                 => ['nullable', 'integer', Rule::in(Constant::CLASS_STATUSES)],
            'subjects'               => ['nullable', 'array'],
            'subjects.*.subject_id'  => ['nullable', 'integer', 'exists:subjects,id'],
            'subjects.*.teacher_id'  => ['nullable', 'integer', 'exists:teachers,id'],
            'subjects.*.tuition_fee' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @param Validator $validator
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $subjects = $this->input('subjects', []);

            if (is_array($subjects)) {
                foreach ($subjects as $idx => $row) {
                    $rowNum = $idx + 1;
                    $subId  = $row['subject_id'] ?? null;
                    $tchId  = $row['teacher_id'] ?? null;

                    if (! empty($subId) && empty($tchId)) {
                        $validator->errors()->add(
                            "subjects.{$idx}.teacher_id",
                            "Vui lòng chọn giáo viên phụ trách cho môn học (dòng {$rowNum})."
                        );
                    }

                    if (empty($subId) && ! empty($tchId)) {
                        $validator->errors()->add(
                            "subjects.{$idx}.subject_id",
                            "Vui lòng chọn môn học tương ứng cho giáo viên (dòng {$rowNum})."
                        );
                    }
                }
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required'             => 'Vui lòng chọn Trung tâm đào tạo.',
            'name.required'                  => 'Vui lòng nhập tên lớp học.',
            'name.max'                       => 'Tên lớp học không được vượt quá 100 ký tự.',
            'code.max'                       => 'Mã lớp học không được vượt quá 20 ký tự.',
            'code.regex'                     => 'Mã lớp học chỉ được chứa ký tự chữ số và gạch ngang.',
            'code.unique'                    => 'Mã lớp học đã tồn tại trong trung tâm này.',
            'max_students.min'               => 'Sĩ số tối đa phải từ 1 học sinh trở lên.',
            'max_students.max'               => 'Sĩ số tối đa không được vượt quá 500 học sinh.',
            'end_date.after_or_equal'        => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'subjects.*.subject_id.required' => 'Vui lòng chọn môn học.',
            'subjects.*.subject_id.exists'   => 'Môn học đã chọn không tồn tại.',
            'subjects.*.teacher_id.required' => 'Vui lòng chọn giáo viên phụ trách cho môn học.',
            'subjects.*.teacher_id.exists'   => 'Giáo viên đã chọn không tồn tại.',
            'subjects.*.tuition_fee.numeric' => 'Học phí môn học phải là dạng số.',
            'subjects.*.tuition_fee.min'     => 'Học phí môn học không được nhỏ hơn 0.',
        ];
    }
}

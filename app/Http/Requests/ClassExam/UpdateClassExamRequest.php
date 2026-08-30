<?php

namespace App\Http\Requests\ClassExam;

use App\Enums\Constant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClassExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'class_id'         => ['sometimes', 'required', 'integer', 'exists:classes,id'],
            'exam_id'          => ['sometimes', 'required', 'integer', 'exists:exams,id'],
            'title'            => ['sometimes', 'required', 'string', 'max:255'],
            'exam_date'        => ['sometimes', 'required', 'date'],
            'start_time'       => ['nullable', 'date_format:H:i,H:i:s'],
            'end_time'         => ['nullable', 'date_format:H:i,H:i:s'],
            'duration_minutes' => ['nullable', 'integer', 'min:1', 'max:600'],
            'max_score'        => ['nullable', 'numeric', 'min:0.1', 'max:1000'],
            'pass_score'       => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'status'           => ['nullable', 'integer', Rule::in(Constant::CLASS_EXAM_STATUSES)],
            'code'             => ['nullable', 'string', 'max:50', Rule::unique('class_exams', 'code')->ignore($this->route('class_exam') ?? $this->route('id'))->whereNull('deleted_at')],
            'access_code'      => ['nullable', 'string', 'max:20'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'class_id.required'  => 'Vui lòng chọn lớp học tổ chức thi.',
            'class_id.exists'    => 'Lớp học được chọn không tồn tại.',
            'exam_id.required'   => 'Vui lòng chọn đề thi từ kho đề thi.',
            'exam_id.exists'     => 'Đề thi được chọn không tồn tại.',
            'title.required'     => 'Tiêu đề kỳ thi là bắt buộc.',
            'title.max'          => 'Tiêu đề kỳ thi không được vượt quá 255 ký tự.',
            'exam_date.required' => 'Ngày thi là bắt buộc.',
        ];
    }
}

<?php

namespace App\Http\Requests\Grading;

use Illuminate\Foundation\Http\FormRequest;

class StoreOfflineExamRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'class_id'            => ['required', 'integer', 'exists:classes,id'],
            'subject_id'          => ['required', 'integer', 'exists:subjects,id'],
            'title'               => ['required', 'string', 'max:255'],
            'exam_date'           => ['required', 'date'],
            'max_score'           => ['required', 'numeric', 'min:1', 'max:100'],
            'pass_score'          => ['nullable', 'numeric', 'min:0', 'lte:max_score'],
            'description'         => ['nullable', 'string', 'max:1000'],
            'scores'              => ['nullable', 'array'],
            'scores.*.student_id' => ['required', 'integer', 'exists:students,id'],
            'scores.*.score'      => ['nullable', 'numeric', 'min:0', 'lte:max_score'],
            'scores.*.comment'    => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'class_id'         => 'lớp học',
            'subject_id'       => 'môn học',
            'title'            => 'tên bài kiểm tra / kỳ thi',
            'exam_date'        => 'ngày thi',
            'max_score'        => 'điểm tối đa',
            'pass_score'       => 'điểm đạt chuẩn',
            'scores.*.score'   => 'điểm số học sinh',
            'scores.*.comment' => 'lời nhận xét',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'pass_score.lte'     => 'Điểm đạt chuẩn không được lớn hơn Điểm tối đa.',
            'scores.*.score.lte' => 'Điểm số học sinh không được vượt quá Điểm tối đa.',
        ];
    }
}

<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExamRequest extends FormRequest
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
        $examId = $this->route('id');

        return [
            'center_id'  => ['required', 'integer', 'exists:centers,id'],
            'class_id'   => ['nullable', 'integer', 'exists:classes,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'name'       => ['required', 'string', 'max:255'],
            'code'       => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('exams', 'code')
                    ->ignore($examId)
                    ->where(function ($query) {
                        return $query->where('center_id', $this->input('center_id'))
                            ->whereNull('deleted_at');
                    }),
            ],
            'exam_type'         => ['required', 'string', 'in:general,ielts,hsk,toeic,custom'],
            'duration_minutes'  => ['nullable', 'integer', 'min:1', 'max:600'],
            'max_score'         => ['required', 'numeric', 'min:0.1', 'max:1000'],
            'pass_score'        => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'shuffle_questions' => ['nullable', 'boolean'],
            'shuffle_options'   => ['nullable', 'boolean'],
            'max_attempts'      => ['nullable', 'integer', 'min:1', 'max:100'],
            'description'       => ['nullable', 'string'],
            'exam_date'         => ['nullable', 'date'],
            'start_time'        => ['nullable', 'date_format:H:i,H:i:s'],
            'end_time'          => ['nullable', 'date_format:H:i,H:i:s'],
            'status'            => ['nullable', 'string', 'in:draft,published,completed,cancelled'],

            // Danh sách câu hỏi
            'questions'                  => ['nullable', 'array'],
            'questions.*.id'             => ['nullable', 'integer'],
            'questions.*.code'           => ['nullable', 'string', 'max:50'],
            'questions.*.skill'          => ['nullable', 'string', 'in:listening,reading,writing,speaking'],
            'questions.*.question_type'  => ['required_with:questions', 'string', 'in:single_choice,multiple_choice,true_false_not_given,fill_in_blank,matching,ordering,diagram_labelling,find_mistake,essay,audio_record'],
            'questions.*.content'        => ['required_with:questions', 'string'],
            'questions.*.score'          => ['required_with:questions', 'numeric', 'min:0'],
            'questions.*.image_url'      => ['nullable', 'string', 'max:500'],
            'questions.*.audio_url'      => ['nullable', 'string', 'max:500'],
            'questions.*.options'        => ['nullable'],
            'questions.*.correct_answer' => ['nullable'],
            'questions.*.explanation'    => ['nullable', 'string'],
            'questions.*.metadata'       => ['nullable'],
            'questions.*.order_index'    => ['nullable', 'integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'center_id.required'                => 'Vui lòng chọn Trung tâm đào tạo.',
            'center_id.exists'                  => 'Trung tâm đã chọn không tồn tại.',
            'name.required'                     => 'Vui lòng nhập tên bài kiểm tra.',
            'code.unique'                       => 'Mã bài kiểm tra đã tồn tại trong trung tâm này.',
            'exam_type.required'                => 'Vui lòng chọn loại bài kiểm tra.',
            'max_score.required'                => 'Vui lòng nhập điểm tối đa của bài thi.',
            'questions.*.content.required_with' => 'Vui lòng nhập nội dung cho tất cả các câu hỏi.',
            'questions.*.score.required_with'   => 'Vui lòng nhập điểm cho từng câu hỏi.',
        ];
    }
}

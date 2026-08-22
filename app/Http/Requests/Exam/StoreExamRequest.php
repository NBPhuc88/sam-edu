<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExamRequest extends FormRequest
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
            'center_id'  => ['required', 'integer', 'exists:centers,id'],
            'class_id'   => ['nullable', 'integer', 'exists:classes,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'name'       => ['required', 'string', 'max:255'],
            'code'       => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('exams', 'code')->where(function ($query) {
                    return $query->where('center_id', $this->input('center_id'))
                        ->whereNull('deleted_at');
                }),
            ],
            'exam_type'         => ['required', 'string', 'in:general,ielts,hsk,toeic,custom,midterm,final,quiz,test,15_min,45_min,practice'],
            'duration_minutes'  => ['nullable', 'integer', 'min:1', 'max:600'],
            'max_score'         => ['required', 'numeric', 'min:0.1', 'max:1000'],
            'pass_score'        => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'shuffle_questions' => ['nullable', 'boolean'],
            'shuffle_options'   => ['nullable', 'boolean'],
            'max_attempts'      => ['nullable', 'integer', 'min:1', 'max:100'],
            'is_practice'       => ['nullable', 'boolean'],
            'description'       => ['nullable', 'string'],
            'exam_date'         => ['nullable', 'date'],
            'start_time'        => ['nullable', 'date_format:H:i,H:i:s'],
            'end_time'          => ['nullable', 'date_format:H:i,H:i:s'],
            'status'            => ['nullable', 'string', 'in:draft,published,completed,cancelled'],

            // Danh sách các Phần thi (Dynamic Sections)
            'sections'                              => ['nullable', 'array'],
            'sections.*.id'                         => ['nullable', 'integer'],
            'sections.*.title'                      => ['required_with:sections', 'string', 'max:255'],
            'sections.*.description'                => ['nullable', 'string'],
            'sections.*.skill'                      => ['required_with:sections', 'string', 'in:listening,reading,writing,speaking'],
            'sections.*.order_index'                => ['nullable', 'integer'],
            'sections.*.questions'                  => ['nullable', 'array'],
            'sections.*.questions.*.id'             => ['nullable', 'integer'],
            'sections.*.questions.*.code'           => ['nullable', 'string', 'max:50'],
            'sections.*.questions.*.skill'          => ['nullable', 'string', 'in:listening,reading,writing,speaking'],
            'sections.*.questions.*.question_type'  => ['required_with:sections.*.questions', 'string', 'in:single_choice,multiple_choice,true_false,true_false_not_given,fill_in_blank,matching,matching_image,matching_sentences,ordering,diagram_labelling,find_mistake,essay,audio_record,short_answer,oral,reading,writing,speaking,listening'],
            'sections.*.questions.*.content'        => ['nullable', 'string'],
            'sections.*.questions.*.score'          => ['nullable', 'numeric', 'min:0'],
            'sections.*.questions.*.image_url'      => ['nullable', 'string', 'max:500'],
            'sections.*.questions.*.audio_url'      => ['nullable', 'string', 'max:500'],
            'sections.*.questions.*.options'        => ['nullable'],
            'sections.*.questions.*.correct_answer' => ['nullable'],
            'sections.*.questions.*.explanation'    => ['nullable', 'string'],
            'sections.*.questions.*.metadata'       => ['nullable'],
            'sections.*.questions.*.order_index'    => ['nullable', 'integer'],

            // Hỗ trợ mảng phẳng questions cũ (tương thích ngược nếu có)
            'questions'                  => ['nullable', 'array'],
            'questions.*.id'             => ['nullable', 'integer'],
            'questions.*.code'           => ['nullable', 'string', 'max:50'],
            'questions.*.skill'          => ['nullable', 'string', 'in:listening,reading,writing,speaking'],
            'questions.*.question_type'  => ['required_with:questions', 'string', 'in:single_choice,multiple_choice,true_false,true_false_not_given,fill_in_blank,matching,matching_image,matching_sentences,ordering,diagram_labelling,find_mistake,essay,audio_record,short_answer,oral,reading,writing,speaking,listening'],
            'questions.*.content'        => ['nullable', 'string'],
            'questions.*.score'          => ['nullable', 'numeric', 'min:0'],
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
            'center_id.required'                      => 'Vui lòng chọn Trung tâm đào tạo.',
            'center_id.exists'                        => 'Trung tâm đã chọn không tồn tại.',
            'name.required'                           => 'Vui lòng nhập tên bài kiểm tra.',
            'code.unique'                             => 'Mã bài kiểm tra đã tồn tại trong trung tâm này.',
            'exam_type.required'                      => 'Vui lòng chọn loại bài kiểm tra.',
            'exam_type.in'                            => 'Loại bài kiểm tra đã chọn không hợp lệ.',
            'max_score.required'                      => 'Vui lòng nhập điểm tối đa của bài thi.',
            'max_score.numeric'                       => 'Điểm tối đa phải là dạng số.',
            'pass_score.numeric'                      => 'Điểm đạt phải là dạng số.',
            'duration_minutes.integer'                => 'Thời gian làm bài phải là số nguyên (phút).',
            'sections.*.title.required_with'          => 'Vui lòng nhập tiêu đề cho từng phần thi.',
            'sections.*.skill.in'                     => 'Kỹ năng của phần thi không hợp lệ.',
            'sections.*.questions.*.question_type.in' => 'Dạng câu hỏi của câu hỏi không hợp lệ.',
        ];
    }

    /**
     * Custom lại toàn bộ message dạng mảng sections.X.questions.Y thành tiếng Việt thân thiện
     * @param \Illuminate\Validation\Validator $validator
     */
    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $validator) {
            $messages       = $validator->messages();
            $customMessages = [];

            foreach ($messages->toArray() as $key => $errors) {
                // sections.0.questions.2.question_type -> Kiểu câu hỏi của câu số 3 phần 1
                if (preg_match('/^sections\.(\d+)\.questions\.(\d+)\.(.+)$/', $key, $matches)) {
                    $secNum = ((int) $matches[1]) + 1;
                    $qNum   = ((int) $matches[2]) + 1;
                    $field  = $matches[3];

                    $fieldLabel = match ($field) {
                        'question_type'  => 'Kiểu câu hỏi',
                        'content'        => 'Nội dung',
                        'score'          => 'Điểm',
                        'code'           => 'Mã câu hỏi',
                        'skill'          => 'Kỹ năng',
                        'options'        => 'Đáp án lựa chọn',
                        'correct_answer' => 'Đáp án đúng',
                        default          => $field,
                    };

                    foreach ($errors as $error) {
                        if (str_contains($error, 'invalid') || str_contains($error, 'không hợp lệ') || str_contains($error, 'in:')) {
                            $customMessages[$key][] = "{$fieldLabel} của câu số {$qNum} phần {$secNum} không hợp lệ.";
                        } elseif (str_contains($error, 'required') || str_contains($error, 'không được để trống')) {
                            $customMessages[$key][] = "Vui lòng nhập {$fieldLabel} của câu số {$qNum} phần {$secNum}.";
                        } else {
                            $customMessages[$key][] = "Câu số {$qNum} phần {$secNum}: {$error}";
                        }
                    }
                }
                // sections.0.title -> Tiêu đề của phần 1
                elseif (preg_match('/^sections\.(\d+)\.(.+)$/', $key, $matches)) {
                    $secNum = ((int) $matches[1]) + 1;
                    $field  = $matches[2];

                    $fieldLabel = match ($field) {
                        'title'       => 'Tiêu đề',
                        'skill'       => 'Kỹ năng',
                        'description' => 'Mô tả',
                        default       => $field,
                    };

                    foreach ($errors as $error) {
                        if (str_contains($error, 'invalid') || str_contains($error, 'không hợp lệ')) {
                            $customMessages[$key][] = "{$fieldLabel} của phần {$secNum} không hợp lệ.";
                        } elseif (str_contains($error, 'required') || str_contains($error, 'không được để trống')) {
                            $customMessages[$key][] = "Vui lòng nhập {$fieldLabel} của phần {$secNum}.";
                        } else {
                            $customMessages[$key][] = "Phần {$secNum}: {$error}";
                        }
                    }
                }
            }

            if (! empty($customMessages)) {
                foreach ($customMessages as $key => $errList) {
                    $messages->forget($key);

                    foreach ($errList as $errMsg) {
                        $messages->add($key, $errMsg);
                    }
                }
            }
        });
    }
}

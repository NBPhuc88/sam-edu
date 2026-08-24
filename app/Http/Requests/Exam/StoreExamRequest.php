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

    protected function prepareForValidation(): void
    {
        $user = $this->user();

        if (! $this->filled('center_id') && $user && isset($user->center_id)) {
            $this->merge([
                'center_id' => $user->center_id,
            ]);
        }
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
            'exam_type_id'      => ['required', 'integer', 'exists:exam_types,id'],
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
            'sections.*.questions.*.title'          => ['nullable', 'string', 'max:500'],
            'sections.*.questions.*.skill'          => ['nullable', 'string', 'in:listening,reading,writing,speaking'],
            'sections.*.questions.*.question_type'  => ['required_with:sections.*.questions', 'string', 'in:single_choice,multiple_choice,true_false_not_given,fill_in_blank,drag_drop_cloze,matching,matching_image,matching_sentences,ordering,diagram_labelling,find_mistake,essay,audio_record,short_answer,oral,reading,writing,speaking,listening'],
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
            'questions.*.title'          => ['nullable', 'string', 'max:500'],
            'questions.*.skill'          => ['nullable', 'string', 'in:listening,reading,writing,speaking'],
            'questions.*.question_type'  => ['required_with:questions', 'string', 'in:single_choice,multiple_choice,true_false_not_given,fill_in_blank,drag_drop_cloze,matching,matching_image,matching_sentences,ordering,diagram_labelling,find_mistake,essay,audio_record,short_answer,oral,reading,writing,speaking,listening'],
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
    public function attributes(): array
    {
        return [
            'center_id'                             => 'Trung tâm đào tạo',
            'subject_id'                            => 'Môn học',
            'class_id'                              => 'Lớp học',
            'name'                                  => 'Tên bài kiểm tra',
            'code'                                  => 'Mã bài kiểm tra',
            'exam_type_id'                          => 'Loại bài kiểm tra',
            'duration_minutes'                      => 'Thời gian làm bài',
            'max_score'                             => 'Điểm tối đa',
            'pass_score'                            => 'Điểm đạt',
            'sections.*.title'                      => 'Tiêu đề phần thi',
            'sections.*.skill'                      => 'Kỹ năng phần thi',
            'sections.*.questions.*.question_type'  => 'Kiểu câu hỏi',
            'sections.*.questions.*.content'        => 'Nội dung câu hỏi',
            'sections.*.questions.*.score'          => 'Điểm câu hỏi',
            'sections.*.questions.*.correct_answer' => 'Đáp án đúng',
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
            'exam_type_id.required'                   => 'Vui lòng chọn loại bài kiểm tra.',
            'exam_type_id.exists'                     => 'Loại bài kiểm tra không tồn tại trong hệ thống.',
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
     * @param \Illuminate\Validation\Validator $validator
     */
    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $validator) {
            $sections = $this->input('sections', []);

            if (is_array($sections)) {
                foreach ($sections as $sIdx => $sec) {
                    $secNum    = $sIdx + 1;
                    $questions = $sec['questions'] ?? [];

                    if (is_array($questions)) {
                        foreach ($questions as $qIdx => $q) {
                            $qNum       = $qIdx + 1;
                            $qType      = $q['question_type'] ?? '';
                            $correctAns = $q['correct_answer'] ?? null;

                            // Các câu hỏi Tự luận (Viết) và Ghi âm (Nói) do giáo viên chấm, không bắt buộc đáp án chuẩn trước
                            if (in_array($qType, ['essay', 'writing', 'audio_record', 'oral', 'speaking'], true)) {
                                continue;
                            }

                            // 1. Trắc nghiệm 1 đáp án, Đúng/Sai, Tìm lỗi sai
                            if (in_array($qType, ['true_false_not_given', 'single_choice', 'find_mistake'], true)) {
                                if ($correctAns === null || $correctAns === '' || (is_string($correctAns) && trim($correctAns) === '')) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng chọn đáp án đúng cho câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 2. Trắc nghiệm nhiều đáp án
                            elseif ($qType === 'multiple_choice') {
                                if (empty($correctAns) || ! is_array($correctAns) || count(array_filter($correctAns)) === 0) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng chọn ít nhất 1 đáp án đúng cho câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 3. Điền vào chỗ trống
                            elseif (in_array($qType, ['fill_in_blank', 'short_answer'], true)) {
                                $hasAnswers = false;

                                if (is_array($correctAns)) {
                                    foreach ($correctAns as $blankConfig) {
                                        if (is_array($blankConfig) && ! empty($blankConfig['accepted_answers'])) {
                                            $nonEmpty = array_filter($blankConfig['accepted_answers'], fn ($a) => is_string($a) && trim($a) !== '');

                                            if (! empty($nonEmpty)) {
                                                $hasAnswers = true;

                                                break;
                                            }
                                        }
                                    }
                                } elseif (is_string($correctAns) && trim($correctAns) !== '') {
                                    $hasAnswers = true;
                                }

                                if (! $hasAnswers) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng nhập đáp án cho chỗ trống của câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 4. Ghép nối (Matching, Nối hình, Ghép câu, Gán nhãn sơ đồ)
                            elseif (in_array($qType, ['matching', 'matching_sentences', 'matching_image', 'diagram_labelling'], true)) {
                                if (empty($correctAns) || ! is_array($correctAns) || count(array_filter($correctAns)) === 0) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng ghép nối đáp án đúng cho câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 5. Sắp xếp thứ tự (Ordering)
                            elseif ($qType === 'ordering') {
                                if (empty($correctAns) || ! is_array($correctAns) || count(array_filter($correctAns)) === 0) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng sắp xếp thứ tự đáp án đúng cho câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 6. Các dạng câu hỏi trắc nghiệm / tự động chấm khác
                            else {
                                if ($correctAns === null || $correctAns === '' || (is_array($correctAns) && count($correctAns) === 0)) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng chọn hoặc nhập đáp án đúng cho câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}

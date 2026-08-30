<?php

namespace App\Http\Requests\Exam;

use App\Enums\Constant;
use App\Models\Exam;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateExamRequest extends FormRequest
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
        $examId   = (int) ($this->route('id') ?? $this->route('exam'));
        $centerId = $this->input('center_id');

        if (! $centerId && $examId) {
            $centerId = Exam::where('id', $examId)->value('center_id');
        }

        return [
            'center_id'  => ['sometimes', 'required', 'integer', 'exists:centers,id'],
            'class_id'   => ['nullable', 'integer', 'exists:classes,id'],
            'subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
            'name'       => ['sometimes', 'required', 'string', 'max:255'],
            'code'       => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('exams', 'code')->whereNull('deleted_at')->ignore($examId),
            ],
            'duration_minutes'  => ['nullable', 'integer', 'min:1', 'max:600'],
            'max_score'         => ['sometimes', 'required', 'numeric', 'min:0.1', 'max:1000'],
            'pass_score'        => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'shuffle_questions' => ['nullable', 'boolean'],
            'shuffle_options'   => ['nullable', 'boolean'],
            'max_attempts'      => ['nullable', 'integer', 'min:1', 'max:100'],
            'is_practice'       => ['nullable', 'boolean'],
            'description'       => ['nullable', 'string'],
            'exam_date'         => ['nullable', 'date'],
            'start_time'        => ['nullable', 'date_format:H:i,H:i:s'],
            'status'            => ['nullable', 'integer', Rule::in(Constant::EXAM_STATUSES)],

            // Danh sách các Phần thi (Dynamic Sections)
            'sections'                              => ['nullable', 'array'],
            'sections.*.id'                         => ['nullable', 'integer'],
            'sections.*.title'                      => ['required_with:sections', 'string', 'max:255'],
            'sections.*.description'                => ['nullable', 'string'],
            'sections.*.skill'                      => ['required_with:sections', 'integer', Rule::in(Constant::EXAM_SKILLS)],
            'sections.*.order_index'                => ['nullable', 'integer'],
            'sections.*.questions'                  => ['nullable', 'array'],
            'sections.*.questions.*.id'             => ['nullable', 'integer'],
            'sections.*.questions.*.code'           => ['nullable', 'string', 'max:50'],
            'sections.*.questions.*.title'          => ['nullable', 'string', 'max:500'],
            'sections.*.questions.*.skill'          => ['nullable', 'integer', Rule::in(Constant::EXAM_SKILLS)],
            'sections.*.questions.*.question_type'  => ['required_with:sections.*.questions', 'integer', Rule::in(Constant::QUESTION_TYPES)],
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
            'questions.*.skill'          => ['nullable', 'integer', Rule::in(Constant::EXAM_SKILLS)],
            'questions.*.question_type'  => ['required_with:questions', 'integer', Rule::in(Constant::QUESTION_TYPES)],
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
     * @param Validator $validator
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $sections = $this->input('sections', []);

            if (is_array($sections)) {
                foreach ($sections as $sIdx => $sec) {
                    $secNum    = $sIdx + 1;
                    $questions = $sec['questions'] ?? [];

                    if (is_array($questions)) {
                        foreach ($questions as $qIdx => $q) {
                            $qNum       = $qIdx + 1;
                            $qTypeRaw   = $q['question_type'] ?? 0;
                            $qType      = (int) $qTypeRaw;
                            $correctAns = $q['correct_answer'] ?? null;

                            // Kiểm tra nội dung câu hỏi bắt buộc
                            if (trim((string) ($q['content'] ?? '')) === '' && $qType !== Constant::QUESTION_TYPE_DIAGRAM_LABELLING) {
                                $validator->errors()->add(
                                    "sections.{$sIdx}.questions.{$qIdx}.content",
                                    "Vui lòng nhập nội dung đề bài cho câu số {$qNum} phần {$secNum}."
                                );
                            }

                            // Các câu hỏi Tự luận (Viết) và Ghi âm / Vấn đáp (Nói) do giáo viên chấm, không bắt buộc đáp án chuẩn trước
                            if (in_array($qType, [Constant::QUESTION_TYPE_ESSAY, Constant::QUESTION_TYPE_AUDIO_RECORD, Constant::QUESTION_TYPE_ORAL], true)) {
                                continue;
                            }

                            // Kiểm tra nội dung các phương án trắc nghiệm
                            if (in_array($qType, [Constant::QUESTION_TYPE_SINGLE_CHOICE, Constant::QUESTION_TYPE_MULTIPLE_CHOICE], true) && is_array($q['options'] ?? null)) {
                                foreach ($q['options'] as $opt) {
                                    $optText = is_array($opt) ? ($opt['text'] ?? '') : (is_string($opt) ? $opt : '');

                                    if (trim((string) $optText) === '') {
                                        $validator->errors()->add(
                                            "sections.{$sIdx}.questions.{$qIdx}.options",
                                            "Vui lòng nhập đầy đủ nội dung các phương án cho câu số {$qNum} phần {$secNum}."
                                        );

                                        break;
                                    }
                                }
                            }

                            // 1. Trắc nghiệm 1 đáp án
                            if ($qType === Constant::QUESTION_TYPE_SINGLE_CHOICE) {
                                $optionIds = [];

                                if (is_array($q['options'] ?? null)) {
                                    foreach ($q['options'] as $opt) {
                                        if (is_array($opt) && isset($opt['id'])) {
                                            $optionIds[] = (string) $opt['id'];
                                        } elseif (is_string($opt)) {
                                            $optionIds[] = $opt;
                                        }
                                    }
                                }

                                if (empty($correctAns) || ! is_string($correctAns) || (! empty($optionIds) && ! in_array((string) $correctAns, $optionIds, true))) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng chọn 1 đáp án đúng hợp lệ cho câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 2. Đúng / Sai / Không đề cập
                            elseif ($qType === Constant::QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN) {
                                $validTfAnswers = ['TRUE', 'FALSE', 'NOT_GIVEN', 'YES', 'NO', 'NOT'];

                                if (empty($correctAns) || ! is_string($correctAns) || ! in_array(strtoupper(trim((string) $correctAns)), $validTfAnswers, true)) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng chọn đáp án đúng (Đúng / Sai / Không đề cập) cho câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 3. Tìm lỗi sai
                            elseif ($qType === Constant::QUESTION_TYPE_FIND_MISTAKE) {
                                $underlinedIds = [];

                                if (is_array($q['options']['sentence_segments'] ?? null)) {
                                    foreach ($q['options']['sentence_segments'] as $seg) {
                                        if (! empty($seg['underlined']) && isset($seg['id'])) {
                                            $underlinedIds[] = (string) $seg['id'];
                                        }
                                    }
                                }

                                if (empty($correctAns) || ! is_string($correctAns) || (! empty($underlinedIds) && ! in_array((string) $correctAns, $underlinedIds, true))) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng chọn phần gạch chân bị sai ngữ pháp cho câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 4. Trắc nghiệm nhiều đáp án
                            elseif ($qType === Constant::QUESTION_TYPE_MULTIPLE_CHOICE) {
                                $optionIds = [];

                                if (is_array($q['options'] ?? null)) {
                                    foreach ($q['options'] as $opt) {
                                        if (is_array($opt) && isset($opt['id'])) {
                                            $optionIds[] = (string) $opt['id'];
                                        }
                                    }
                                }
                                $filteredAns = is_array($correctAns) ? array_filter($correctAns, fn ($a) => is_string($a) && trim($a) !== '') : [];

                                if (empty($filteredAns)) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng chọn ít nhất 1 đáp án đúng cho câu số {$qNum} phần {$secNum}."
                                    );
                                } elseif (! empty($optionIds)) {
                                    foreach ($filteredAns as $ansId) {
                                        if (! in_array((string) $ansId, $optionIds, true)) {
                                            $validator->errors()->add(
                                                "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                                "Đáp án đã chọn không khớp với các phương án của câu số {$qNum} phần {$secNum}."
                                            );

                                            break;
                                        }
                                    }
                                }
                            }
                            // 5. Điền vào chỗ trống / Trả lời ngắn
                            elseif (in_array($qType, [Constant::QUESTION_TYPE_FILL_IN_BLANK, Constant::QUESTION_TYPE_SHORT_ANSWER], true)) {
                                $hasAnswers = false;

                                if (is_array($correctAns)) {
                                    foreach ($correctAns as $blankConfig) {
                                        if (is_array($blankConfig)) {
                                            $accepted = $blankConfig['accepted_answers'] ?? $blankConfig;

                                            if (is_array($accepted)) {
                                                $nonEmpty = array_filter($accepted, fn ($a) => is_scalar($a) && trim((string) $a) !== '');

                                                if (! empty($nonEmpty)) {
                                                    $hasAnswers = true;

                                                    break;
                                                }
                                            } elseif (is_scalar($accepted) && trim((string) $accepted) !== '') {
                                                $hasAnswers = true;

                                                break;
                                            }
                                        } elseif (is_scalar($blankConfig) && trim((string) $blankConfig) !== '') {
                                            $hasAnswers = true;

                                            break;
                                        }
                                    }
                                } elseif (is_scalar($correctAns) && trim((string) $correctAns) !== '') {
                                    $hasAnswers = true;
                                }

                                if (! $hasAnswers) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng nhập đáp án cho chỗ trống của câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 6. Kéo thả từ vào chỗ trống (Drag & Drop Cloze)
                            elseif ($qType === Constant::QUESTION_TYPE_DRAG_DROP_CLOZE) {
                                $hasAnswers = false;

                                if (is_array($correctAns)) {
                                    $nonEmpty = array_filter($correctAns, fn ($w) => is_scalar($w) && trim((string) $w) !== '');

                                    if (! empty($nonEmpty)) {
                                        $hasAnswers = true;
                                    }
                                }

                                if (! $hasAnswers) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng chọn từ đúng cho các ô trống của câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 7. Ghép nối (Matching, Nối hình, Ghép câu, Gán nhãn sơ đồ)
                            elseif (in_array($qType, [Constant::QUESTION_TYPE_MATCHING, Constant::QUESTION_TYPE_MATCHING_IMAGE, Constant::QUESTION_TYPE_MATCHING_SENTENCES, Constant::QUESTION_TYPE_DIAGRAM_LABELLING], true)) {
                                if (empty($correctAns) || ! is_array($correctAns) || count(array_filter($correctAns, fn ($v) => is_scalar($v) && trim((string) $v) !== '')) === 0) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng ghép nối đáp án đúng cho câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 8. Sắp xếp thứ tự (Ordering)
                            elseif ($qType === Constant::QUESTION_TYPE_ORDERING) {
                                if (empty($correctAns) || ! is_array($correctAns) || count(array_filter($correctAns)) === 0) {
                                    $validator->errors()->add(
                                        "sections.{$sIdx}.questions.{$qIdx}.correct_answer",
                                        "Vui lòng sắp xếp thứ tự đáp án đúng cho câu số {$qNum} phần {$secNum}."
                                    );
                                }
                            }
                            // 9. Các dạng câu hỏi trắc nghiệm / tự động chấm khác
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

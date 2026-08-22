<?php

namespace App\Repositories\Exam;

use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ExamRepository implements ExamRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  int|array<int>|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  int|string|null      $examType
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        int|array|null $centerIds = null,
        ?int $classId = null,
        ?int $subjectId = null,
        int|string|null $examType = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator {
        $query = Exam::query()
            ->select(
                'id',
                'center_id',
                'class_id',
                'subject_id',
                'code',
                'name',
                'description',
                'exam_type_id',
                'duration_minutes',
                'max_score',
                'pass_score',
                'status',
                'created_at'
            )
            ->with([
                'center:id,name,code',
                'schoolClass:id,name,code',
                'subject:id,name,code',
                'examType:id,name,code',
            ])
            ->withCount(['questions', 'sections', 'examResults']);

        if ($centerIds !== null) {
            if (is_array($centerIds)) {
                $query->whereIn('center_id', $centerIds);
            } else {
                $query->where('center_id', $centerIds);
            }
        }

        if ($classId !== null) {
            $query->where('class_id', $classId);
        }

        if ($subjectId !== null) {
            $query->where('subject_id', $subjectId);
        }

        if ($examType !== null && $examType !== 'all') {
            if (is_numeric($examType)) {
                $query->where('exam_type_id', (int) $examType);
            } else {
                $query->whereHas('examType', function ($q) use ($examType) {
                    $q->where('code', $examType);
                });
            }
        }

        if ($status !== null && $status !== 'all') {
            $query->where('status', $status);
        }

        if (! empty($search)) {
            $search = trim($search);
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->orderByDesc('id')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Exam|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Exam
    {
        $query = Exam::query()
            ->select(
                'id',
                'center_id',
                'class_id',
                'subject_id',
                'code',
                'name',
                'description',
                'exam_type_id',
                'duration_minutes',
                'max_score',
                'pass_score',
                'status',
                'created_at'
            )
            ->with([
                'center:id,name,code',
                'schoolClass:id,name,code',
                'subject:id,name,code',
                'examType:id,name,code',
                'sections' => function ($sq) {
                    $sq->select(
                        'id',
                        'exam_id',
                        'title',
                        'description',
                        'skill',
                        'order_index'
                    )
                    ->orderBy('order_index')->orderBy('id')
                    ->with(['questions' => function ($qq) {
                        $qq->select(
                            'id',
                            'exam_id',
                            'section_id',
                            'code',
                            'question_type',
                            'skill',
                            'content',
                            'image_url',
                            'audio_url',
                            'score',
                            'options',
                            'correct_answer',
                            'explanation',
                            'metadata',
                            'order_index'
                        )
                        ->orderBy('order_index')
                        ->orderBy('id');
                    }]);
                },
                'questions' => function ($q) {
                    $q->select(
                        'id',
                        'exam_id',
                        'section_id',
                        'code',
                        'question_type',
                        'skill',
                        'content',
                        'image_url',
                        'audio_url',
                        'score',
                        'options',
                        'correct_answer',
                        'explanation',
                        'metadata',
                        'order_index'
                    )
                    ->orderBy('order_index')
                    ->orderBy('id');
                },
            ])
            ->withCount(['questions', 'sections', 'examResults']);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        /** @var Exam|null $exam */
        $exam = $query->find($id);

        return $exam;
    }

    /**
     * @param  array<string, mixed> $data
     * @return Exam
     */
    public function create(array $data): Exam
    {
        return Exam::create($data);
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Exam
     */
    public function update(int $id, array $data): Exam
    {
        $exam = Exam::findOrFail($id);
        $exam->update($data);

        return $exam->fresh([
            'center:id,name,code',
            'schoolClass:id,name,code',
            'subject:id,name,code',
            'sections.questions',
            'questions',
        ]);
    }

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $exam = Exam::findOrFail($id);

        return (bool) $exam->delete();
    }

    /**
     * @param  array<int> $centerIds
     * @return int
     */
    public function countByCenterIds(array $centerIds): int
    {
        return Exam::query()->whereIn('center_id', $centerIds)->count();
    }

    /**
     * @param  int      $centerId
     * @param  string   $code
     * @param  int|null $excludeId
     * @return bool
     */
    public function codeExists(int $centerId, string $code, ?int $excludeId = null): bool
    {
        $query = Exam::query()
            ->where('center_id', $centerId)
            ->where('code', $code);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * @param  Exam              $exam
     * @param  array<int, mixed> $questions
     * @return void
     */
    public function syncQuestions(Exam $exam, array $questions): void
    {
        $existingQuestionIds = $exam->questions()->pluck('id')->toArray();
        $incomingQuestionIds = [];

        foreach ($questions as $index => $qData) {
            $qId = ! empty($qData['id']) ? (int) $qData['id'] : null;

            // Tự động sinh mã câu hỏi nếu chưa có
            $qCode = trim($qData['code'] ?? '');

            if (empty($qCode)) {
                $qCode = sprintf('Q%09d', ($index + 1));
            }

            $payload = [
                'exam_id'        => $exam->id,
                'section_id'     => ! empty($qData['section_id']) ? (int) $qData['section_id'] : null,
                'code'           => $qCode,
                'question_type'  => $qData['question_type'] ?? 'single_choice',
                'skill'          => ! empty($qData['skill']) ? $qData['skill'] : 'reading',
                'content'        => $qData['content'] ?? '',
                'image_url'      => ! empty($qData['image_url']) ? $qData['image_url'] : null,
                'audio_url'      => ! empty($qData['audio_url']) ? $qData['audio_url'] : null,
                'score'          => isset($qData['score']) ? (float) $qData['score'] : 1.00,
                'options'        => $qData['options'] ?? null,
                'correct_answer' => $qData['correct_answer'] ?? null,
                'explanation'    => ! empty($qData['explanation']) ? $qData['explanation'] : null,
                'metadata'       => $qData['metadata'] ?? null,
                'order_index'    => isset($qData['order_index']) ? (int) $qData['order_index'] : $index,
            ];

            if ($qId && in_array($qId, $existingQuestionIds, true)) {
                $existingQ = ExamQuestion::where('id', $qId)->where('exam_id', $exam->id)->first();

                if ($existingQ) {
                    $existingQ->update($payload);
                    $incomingQuestionIds[] = $qId;
                }
            } else {
                $newQuestion           = ExamQuestion::create($payload);
                $incomingQuestionIds[] = $newQuestion->id;
            }
        }

        // Xóa các câu hỏi không còn nằm trong danh sách gửi lên
        $toDelete = array_diff($existingQuestionIds, $incomingQuestionIds);

        if (! empty($toDelete)) {
            ExamQuestion::whereIn('id', $toDelete)->where('exam_id', $exam->id)->delete();
        }
    }

    /**
     * Đồng bộ các Phần thi (Dynamic Sections) và danh sách câu hỏi trong từng phần
     *
     * @param  Exam              $exam
     * @param  array<int, mixed> $sections
     * @return void
     */
    public function syncSections(Exam $exam, array $sections): void
    {
        $existingSectionIds  = $exam->sections()->pluck('id')->toArray();
        $existingQuestionIds = $exam->questions()->pluck('id')->toArray();

        $incomingSectionIds  = [];
        $incomingQuestionIds = [];

        $globalQuestionIndex = 0;

        foreach ($sections as $sectionIndex => $secData) {
            $secId = ! empty($secData['id']) ? (int) $secData['id'] : null;

            $sectionPayload = [
                'exam_id'     => $exam->id,
                'title'       => trim($secData['title'] ?? ('Phần ' . ($sectionIndex + 1))),
                'description' => ! empty($secData['description']) ? trim($secData['description']) : null,
                'skill'       => ! empty($secData['skill']) ? $secData['skill'] : 'reading',
                'order_index' => isset($secData['order_index']) ? (int) $secData['order_index'] : $sectionIndex,
            ];

            if ($secId && in_array($secId, $existingSectionIds, true)) {
                $section = ExamSection::where('id', $secId)->where('exam_id', $exam->id)->first();

                if ($section) {
                    $section->update($sectionPayload);
                } else {
                    $section = ExamSection::create($sectionPayload);
                }
                $incomingSectionIds[] = $section->id;
            } else {
                $section              = ExamSection::create($sectionPayload);
                $incomingSectionIds[] = $section->id;
            }

            // Xử lý các câu hỏi thuộc Section này
            $secQuestions = $secData['questions'] ?? [];

            foreach ($secQuestions as $qLocalIndex => $qData) {
                $globalQuestionIndex++;
                $qId = ! empty($qData['id']) ? (int) $qData['id'] : null;

                $qCode = trim($qData['code'] ?? '');

                if (empty($qCode)) {
                    $qCode = sprintf('Q%09d', $globalQuestionIndex);
                }

                $questionPayload = [
                    'exam_id'        => $exam->id,
                    'section_id'     => $section->id,
                    'code'           => $qCode,
                    'question_type'  => $qData['question_type'] ?? 'single_choice',
                    'skill'          => $section->skill,
                    'content'        => $qData['content'] ?? '',
                    'image_url'      => ! empty($qData['image_url']) ? $qData['image_url'] : null,
                    'audio_url'      => ! empty($qData['audio_url']) ? $qData['audio_url'] : null,
                    'score'          => isset($qData['score']) ? (float) $qData['score'] : 1.00,
                    'options'        => $qData['options'] ?? null,
                    'correct_answer' => $qData['correct_answer'] ?? null,
                    'explanation'    => ! empty($qData['explanation']) ? $qData['explanation'] : null,
                    'metadata'       => $qData['metadata'] ?? null,
                    'order_index'    => isset($qData['order_index']) ? (int) $qData['order_index'] : $qLocalIndex,
                ];

                if ($qId && in_array($qId, $existingQuestionIds, true)) {
                    $existingQ = ExamQuestion::where('id', $qId)->where('exam_id', $exam->id)->first();

                    if ($existingQ) {
                        $existingQ->update($questionPayload);
                        $incomingQuestionIds[] = $qId;
                    }
                } else {
                    $newQuestion           = ExamQuestion::create($questionPayload);
                    $incomingQuestionIds[] = $newQuestion->id;
                }
            }
        }

        // Xóa các câu hỏi không còn nằm trong danh sách
        $questionsToDelete = array_diff($existingQuestionIds, $incomingQuestionIds);

        if (! empty($questionsToDelete)) {
            ExamQuestion::whereIn('id', $questionsToDelete)->where('exam_id', $exam->id)->delete();
        }

        // Xóa các section không còn nằm trong danh sách
        $sectionsToDelete = array_diff($existingSectionIds, $incomingSectionIds);

        if (! empty($sectionsToDelete)) {
            ExamSection::whereIn('id', $sectionsToDelete)->where('exam_id', $exam->id)->delete();
        }
    }

    /**
     * @param  array<int>|null    $allowedCenterIds
     * @return array<string, int>
     */
    public function getStats(?array $allowedCenterIds = null): array
    {
        $examQuery = Exam::query();

        if ($allowedCenterIds !== null) {
            $examQuery->whereIn('center_id', $allowedCenterIds);
        }

        $total     = (clone $examQuery)->count();
        $published = (clone $examQuery)->where('status', 'published')->count();
        $draft     = (clone $examQuery)->where('status', 'draft')->count();

        $questionQuery = ExamQuestion::query();

        if ($allowedCenterIds !== null) {
            $questionQuery->whereHas('exam', function ($q) use ($allowedCenterIds) {
                $q->whereIn('center_id', $allowedCenterIds);
            });
        }
        $totalQuestions = $questionQuery->count();

        return [
            'total'           => $total,
            'published'       => $published,
            'draft'           => $draft,
            'total_questions' => $totalQuestions,
        ];
    }

    public function getPublishedExamsForDropdown(?array $allowedCenterIds = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Exam::query()
            ->select('id', 'center_id', 'subject_id', 'name', 'code', 'exam_type_id', 'duration_minutes', 'max_score')
            ->where('status', 'published')
            ->with([
                'subject:id,name,code',
                'examType:id,name,code',
                'sections:id,exam_id,title,description,skill,order_index',
            ]);

        if ($allowedCenterIds !== null) {
            $query->whereIn('center_id', $allowedCenterIds);
        }

        return $query->orderBy('name')->get();
    }
}

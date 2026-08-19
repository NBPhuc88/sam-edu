<?php

namespace App\Repositories\Exam;

use App\Models\Exam;
use App\Models\ExamQuestion;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ExamRepository implements ExamRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  int|array<int>|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  ?string              $examType
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
        ?string $examType = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator {
        $query = Exam::query()
            ->with([
                'center:id,name,code',
                'schoolClass:id,name,code',
                'subject:id,name,code',
            ])
            ->withCount(['questions', 'examResults']);

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
            $query->where('exam_type', $examType);
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
            ->with([
                'center:id,name,code',
                'schoolClass:id,name,code',
                'subject:id,name,code',
                'questions' => function ($q) {
                    $q->orderBy('order_index')->orderBy('id');
                },
            ])
            ->withCount(['questions', 'examResults']);

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
        DB::transaction(function () use ($exam, $questions) {
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
                    ExamQuestion::where('id', $qId)->where('exam_id', $exam->id)->update($payload);
                    $incomingQuestionIds[] = $qId;
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
        });
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
}

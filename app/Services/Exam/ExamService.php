<?php

namespace App\Services\Exam;

use App\Models\Admin;
use App\Models\Exam;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Exam\ExamRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ExamService implements ExamServiceInterface
{
    public function __construct(
        protected ExamRepositoryInterface $examRepository,
        protected CenterRepositoryInterface $centerRepository
    ) {
    }

    /**
     * @param  ?Admin          $admin
     * @return array<int>|null Null nghĩa là Super Admin (truy cập toàn bộ)
     */
    protected function getAllowedCenterIds(?Admin $admin): ?array
    {
        if (! $admin) {
            return [];
        }

        if ($admin->isSuperAdmin()) {
            return null; // Super admin
        }

        return $admin->centers()->pluck('centers.id')->toArray();
    }

    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  ?string              $examType
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  ?Admin               $admin
     * @return LengthAwarePaginator
     */
    public function getPaginatedExams(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $subjectId = null,
        ?string $examType = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null
    ): LengthAwarePaginator {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null) {
            if ($centerId !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                $centerIds = []; // Không có quyền
            } elseif ($centerId !== null) {
                $centerIds = [$centerId];
            } else {
                $centerIds = $allowedCenterIds;
            }
        } else {
            $centerIds = $centerId;
        }

        return $this->examRepository->paginate(
            $search,
            $centerIds,
            $classId,
            $subjectId,
            $examType,
            $status,
            $perPage,
            $page
        );
    }

    /**
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getFormData(?Admin $admin = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if ($allowedCenterIds !== null) {
            $centers = $this->centerRepository->getByIds($allowedCenterIds, ['id', 'name', 'code']);
            $classes = SchoolClass::query()
                ->whereIn('center_id', $allowedCenterIds)
                ->where('status', 1)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'center_id']);
            $subjects = Subject::query()
                ->whereIn('center_id', $allowedCenterIds)
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'center_id']);
        } else {
            $centers = $this->centerRepository->getActiveCenters();
            $classes = SchoolClass::query()
                ->where('status', 1)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'center_id']);
            $subjects = Subject::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'center_id']);
        }

        return [
            'centers'  => $centers,
            'classes'  => $classes,
            'subjects' => $subjects,
        ];
    }

    /**
     * @param  int       $id
     * @param  ?Admin    $admin
     * @return Exam|null
     */
    public function findExam(int $id, ?Admin $admin = null): ?Exam
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $exam             = $this->examRepository->find($id, $allowedCenterIds);

        if (! $exam) {
            throw new NotFoundHttpException('Không tìm thấy bài kiểm tra hoặc bạn không có quyền truy cập.');
        }

        return $exam;
    }

    /**
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Exam
     */
    public function createExam(array $data, ?Admin $admin = null): Exam
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $centerId         = (int) $data['center_id'];

        if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
            throw new AccessDeniedHttpException('Bạn không có quyền tạo bài kiểm tra cho Trung tâm này.');
        }

        // Tự động sinh mã nếu để trống
        $code = trim($data['code'] ?? '');

        if (empty($code)) {
            $count = $this->examRepository->countByCenterIds([$centerId]) + 1;
            $code  = sprintf('EXM%09d', $count);

            while ($this->examRepository->codeExists($centerId, $code)) {
                $count++;
                $code = sprintf('EXM%09d', $count);
            }
        }

        $sections  = $data['sections'] ?? null;
        $questions = $data['questions'] ?? [];
        unset($data['sections'], $data['questions']);

        $examData = array_merge($data, [
            'center_id'           => $centerId,
            'code'                => $code,
            'created_by_admin_id' => $admin?->id,
            'status'              => $data['status'] ?? 'draft',
            'shuffle_questions'   => ! empty($data['shuffle_questions']),
            'shuffle_options'     => ! empty($data['shuffle_options']),
            'max_attempts'        => ! empty($data['max_attempts']) ? (int) $data['max_attempts'] : 1,
            'duration_minutes'    => ! empty($data['duration_minutes']) ? (int) $data['duration_minutes'] : 45,
            'max_score'           => ! empty($data['max_score']) ? (float) $data['max_score'] : 10.00,
            'pass_score'          => ! empty($data['pass_score']) ? (float) $data['pass_score'] : null,
            'class_id'            => ! empty($data['class_id']) ? (int) $data['class_id'] : null,
            'subject_id'          => ! empty($data['subject_id']) ? (int) $data['subject_id'] : null,
            'exam_date'           => ! empty($data['exam_date']) ? $data['exam_date'] : null,
            'start_time'          => ! empty($data['start_time']) ? $data['start_time'] : null,
            'end_time'            => ! empty($data['end_time']) ? $data['end_time'] : null,
        ]);

        $exam = $this->examRepository->create($examData);

        if (! empty($sections)) {
            $this->examRepository->syncSections($exam, $sections);
        } elseif (! empty($questions)) {
            $this->examRepository->syncQuestions($exam, $questions);
        }

        return $exam;
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Exam
     */
    public function updateExam(int $id, array $data, ?Admin $admin = null): Exam
    {
        $exam             = $this->findExam($id, $admin);
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        if (isset($data['center_id'])) {
            $centerId = (int) $data['center_id'];

            if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                throw new AccessDeniedHttpException('Bạn không có quyền chuyển bài kiểm tra sang Trung tâm này.');
            }
        }

        $code = isset($data['code']) ? trim($data['code']) : $exam->code;

        if (empty($code)) {
            $code = $exam->code;
        }

        $sections  = $data['sections'] ?? null;
        $questions = $data['questions'] ?? null;
        unset($data['sections'], $data['questions']);

        $updateData = array_merge($data, [
            'code'              => $code,
            'shuffle_questions' => isset($data['shuffle_questions']) ? (bool) $data['shuffle_questions'] : $exam->shuffle_questions,
            'shuffle_options'   => isset($data['shuffle_options']) ? (bool) $data['shuffle_options'] : $exam->shuffle_options,
            'max_attempts'      => isset($data['max_attempts']) ? (int) $data['max_attempts'] : $exam->max_attempts,
            'duration_minutes'  => isset($data['duration_minutes']) ? (int) $data['duration_minutes'] : $exam->duration_minutes,
            'max_score'         => isset($data['max_score']) ? (float) $data['max_score'] : $exam->max_score,
            'pass_score'        => array_key_exists('pass_score', $data) ? ($data['pass_score'] !== null ? (float) $data['pass_score'] : null) : $exam->pass_score,
            'class_id'          => array_key_exists('class_id', $data) ? (! empty($data['class_id']) ? (int) $data['class_id'] : null) : $exam->class_id,
            'subject_id'        => array_key_exists('subject_id', $data) ? (! empty($data['subject_id']) ? (int) $data['subject_id'] : null) : $exam->subject_id,
            'exam_date'         => array_key_exists('exam_date', $data) ? (! empty($data['exam_date']) ? $data['exam_date'] : null) : $exam->exam_date,
            'start_time'        => array_key_exists('start_time', $data) ? (! empty($data['start_time']) ? $data['start_time'] : null) : $exam->start_time,
            'end_time'          => array_key_exists('end_time', $data) ? (! empty($data['end_time']) ? $data['end_time'] : null) : $exam->end_time,
        ]);

        $updatedExam = $this->examRepository->update($id, $updateData);

        if ($sections !== null) {
            $this->examRepository->syncSections($updatedExam, $sections);
        } elseif ($questions !== null) {
            $this->examRepository->syncQuestions($updatedExam, $questions);
        }

        return $updatedExam->fresh([
            'center:id,name,code',
            'schoolClass:id,name,code',
            'subject:id,name,code',
            'sections.questions',
            'questions',
        ]);
    }

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return bool
     */
    public function deleteExam(int $id, ?Admin $admin = null): bool
    {
        $exam = $this->findExam($id, $admin);

        return $this->examRepository->delete($exam->id);
    }

    /**
     * @param  ?Admin             $admin
     * @return array<string, int>
     */
    public function getStats(?Admin $admin = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        return $this->examRepository->getStats($allowedCenterIds);
    }
}

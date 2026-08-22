<?php

namespace App\Services\Exam;

use App\Models\Admin;
use App\Models\Exam;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Exam\ExamRepositoryInterface;
use App\Repositories\Subject\SubjectRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ExamService implements ExamServiceInterface
{
    public function __construct(
        protected ExamRepositoryInterface $examRepository,
        protected CenterRepositoryInterface $centerRepository,
        protected SchoolClassRepositoryInterface $schoolClassRepository,
        protected SubjectRepositoryInterface $subjectRepository
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
            return null; // All centers
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
                $centerIds = []; // No access
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

        return [
            'centers'  => $allowedCenterIds !== null ? $this->centerRepository->getByIds($allowedCenterIds, ['id', 'name', 'code']) : $this->centerRepository->getActiveCenters(),
            'classes'  => $this->schoolClassRepository->getClassesByCenterIds($allowedCenterIds),
            'subjects' => $this->subjectRepository->getByCenterIds($allowedCenterIds),
        ];
    }

    /**
     * @param  int    $id
     * @param  ?Admin $admin
     * @return Exam
     */
    public function findExam(int $id, ?Admin $admin = null): Exam
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);
        $exam             = $this->examRepository->find($id, $allowedCenterIds);

        if (! $exam) {
            throw new NotFoundHttpException('Không tìm thấy đề thi hoặc bạn không có quyền truy cập.');
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
            throw new AccessDeniedHttpException('Bạn không có quyền thêm đề thi vào Trung tâm này.');
        }

        $code = trim($data['code'] ?? '');

        if (empty($code)) {
            $count = $this->examRepository->countByCenterIds([$centerId]) + 1;
            $code  = 'EX' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
        }

        if ($this->examRepository->codeExists($centerId, $code)) {
            throw new AccessDeniedHttpException("Mã đề thi '{$code}' đã tồn tại trong trung tâm.");
        }

        $payload = [
            'center_id'           => $centerId,
            'subject_id'          => (int) $data['subject_id'],
            'class_id'            => ! empty($data['class_id']) ? (int) $data['class_id'] : null,
            'name'                => trim($data['name']),
            'code'                => $code,
            'exam_type'           => $data['exam_type'] ?? 'general',
            'description'         => $data['description'] ?? null,
            'duration_minutes'    => (int) ($data['duration_minutes'] ?? 45),
            'max_score'           => (float) ($data['max_score'] ?? 10.0),
            'pass_score'          => (float) ($data['pass_score'] ?? 5.0),
            'shuffle_questions'   => ! empty($data['shuffle_questions']),
            'shuffle_options'     => ! empty($data['shuffle_options']),
            'max_attempts'        => isset($data['max_attempts']) ? (int) $data['max_attempts'] : 1,
            'is_practice'         => ! empty($data['is_practice']),
            'status'              => $data['status'] ?? 'draft',
            'created_by_admin_id' => $admin?->id,
        ];

        return DB::transaction(function () use ($payload, $data) {
            $exam = $this->examRepository->create($payload);

            // Đồng bộ phần thi & câu hỏi nếu có
            if (! empty($data['sections']) && is_array($data['sections'])) {
                $this->examRepository->syncSections($exam, $data['sections']);
            } elseif (! empty($data['questions']) && is_array($data['questions'])) {
                $this->examRepository->syncQuestions($exam, $data['questions']);
            }

            return $exam->fresh(['subject', 'sections.questions']);
        });
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  ?Admin               $admin
     * @return Exam
     */
    public function updateExam(int $id, array $data, ?Admin $admin = null): Exam
    {
        $exam = $this->findExam($id, $admin);

        if (isset($data['center_id'])) {
            $centerId         = (int) $data['center_id'];
            $allowedCenterIds = $this->getAllowedCenterIds($admin);

            if ($allowedCenterIds !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                throw new AccessDeniedHttpException('Bạn không có quyền chuyển đề thi sang Trung tâm này.');
            }
        }

        $code = ! empty($data['code']) ? trim($data['code']) : $exam->code;

        if ($code !== $exam->code && $this->examRepository->codeExists((int) ($data['center_id'] ?? $exam->center_id), $code, $exam->id)) {
            throw new AccessDeniedHttpException("Mã đề thi '{$code}' đã tồn tại trong trung tâm.");
        }

        $payload = [
            'center_id'         => $data['center_id'] ?? $exam->center_id,
            'subject_id'        => isset($data['subject_id']) ? (int) $data['subject_id'] : $exam->subject_id,
            'class_id'          => array_key_exists('class_id', $data) ? ($data['class_id'] ? (int) $data['class_id'] : null) : $exam->class_id,
            'name'              => isset($data['name']) ? trim($data['name']) : $exam->name,
            'code'              => $code,
            'exam_type'         => $data['exam_type'] ?? $exam->exam_type,
            'description'       => array_key_exists('description', $data) ? $data['description'] : $exam->description,
            'duration_minutes'  => isset($data['duration_minutes']) ? (int) $data['duration_minutes'] : $exam->duration_minutes,
            'max_score'         => isset($data['max_score']) ? (float) $data['max_score'] : $exam->max_score,
            'pass_score'        => isset($data['pass_score']) ? (float) $data['pass_score'] : $exam->pass_score,
            'shuffle_questions' => array_key_exists('shuffle_questions', $data) ? (bool) $data['shuffle_questions'] : (bool) $exam->shuffle_questions,
            'shuffle_options'   => array_key_exists('shuffle_options', $data) ? (bool) $data['shuffle_options'] : (bool) $exam->shuffle_options,
            'max_attempts'      => isset($data['max_attempts']) ? (int) $data['max_attempts'] : (int) ($exam->max_attempts ?? 1),
            'is_practice'       => array_key_exists('is_practice', $data) ? (bool) $data['is_practice'] : (bool) $exam->is_practice,
            'status'            => $data['status'] ?? $exam->status,
        ];

        return DB::transaction(function () use ($id, $payload, $data) {
            $updated = $this->examRepository->update($id, $payload);

            // Đồng bộ lại phần thi / câu hỏi nếu được truyền lên
            if (array_key_exists('sections', $data) && is_array($data['sections'])) {
                $this->examRepository->syncSections($updated, $data['sections']);
            } elseif (array_key_exists('questions', $data) && is_array($data['questions'])) {
                $this->examRepository->syncQuestions($updated, $data['questions']);
            }

            return $updated->fresh(['subject', 'sections.questions']);
        });
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
     * @param  ?Admin               $admin
     * @return array<string, mixed>
     */
    public function getStats(?Admin $admin = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($admin);

        return $this->examRepository->getStats($allowedCenterIds);
    }
}

<?php

namespace App\Services\Exam;

use App\Models\Admin;
use App\Models\Exam;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Exam\ExamRepositoryInterface;
use App\Repositories\ExamType\ExamTypeRepositoryInterface;
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
        protected SubjectRepositoryInterface $subjectRepository,
        protected ExamTypeRepositoryInterface $examTypeRepository
    ) {
    }

    /**
     * @param  Admin|Teacher|null $user
     * @return array<int>|null    Null nghĩa là Super Admin (truy cập toàn bộ)
     */
    protected function getAllowedCenterIds(Admin|Teacher|null $user): ?array
    {
        if (! $user) {
            return [];
        }

        if ($user instanceof Admin) {
            if ($user->isSuperAdmin()) {
                return null; // All centers
            }

            return $user->centers()->pluck('centers.id')->toArray();
        }

        if ($user instanceof Teacher) {
            return $user->center_id ? [(int) $user->center_id] : [];
        }

        return [];
    }

    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  int|string|null      $examType
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  Admin|Teacher|null   $user
     * @return LengthAwarePaginator
     */
    public function getPaginatedExams(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $subjectId = null,
        int|string|null $examType = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        Admin|Teacher|null $user = null
    ): LengthAwarePaginator {
        $allowedCenterIds = $this->getAllowedCenterIds($user);

        if ($allowedCenterIds !== null) {
            if ($centerId !== null && ! in_array($centerId, $allowedCenterIds, true)) {
                $centerIds = []; // No access
            } elseif ($centerId !== null) {
                $centerIds = $centerId;
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
     * @param  Admin|Teacher|null   $user
     * @return array<string, mixed>
     */
    public function getFormData(Admin|Teacher|null $user = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($user);

        if ($user instanceof Teacher) {
            $centerId = (int) $user->center_id;

            // Giáo viên chỉ chọn được các môn học mình đang dạy thuộc trung tâm
            $taughtSubjectIds = DB::table('class_subjects')
                ->where('teacher_id', $user->id)
                ->pluck('subject_id')
                ->unique()
                ->toArray();

            if (! empty($taughtSubjectIds)) {
                $subjects = \App\Models\Subject::whereIn('id', $taughtSubjectIds)
                    ->where('center_id', $centerId)
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get();
            } else {
                $subjects = \App\Models\Subject::where('center_id', $centerId)
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get();
            }

            // Chỉ show loại đề thi của trung tâm mình
            $examTypes = \App\Models\ExamType::where('center_id', $centerId)
                ->where('status', 'active')
                ->orderBy('name')
                ->get();

            return [
                'centers'    => $this->centerRepository->getByIds([$centerId], ['id', 'name', 'code']),
                'classes'    => $this->schoolClassRepository->getClassesByCenterIds([$centerId]),
                'subjects'   => $subjects,
                'exam_types' => $examTypes,
            ];
        }

        $subjects  = $this->subjectRepository->getByCenterIds($allowedCenterIds);
        $examTypes = $this->examTypeRepository->getAllActive($allowedCenterIds);

        return [
            'centers'    => $allowedCenterIds !== null ? $this->centerRepository->getByIds($allowedCenterIds, ['id', 'name', 'code']) : $this->centerRepository->getActiveCenters(),
            'classes'    => $this->schoolClassRepository->getClassesByCenterIds($allowedCenterIds),
            'subjects'   => $subjects,
            'exam_types' => $examTypes,
        ];
    }

    /**
     * @param  int                $id
     * @param  Admin|Teacher|null $user
     * @return Exam
     */
    public function findExam(int $id, Admin|Teacher|null $user = null): Exam
    {
        $allowedCenterIds = $this->getAllowedCenterIds($user);
        $exam             = $this->examRepository->find($id, $allowedCenterIds);

        if (! $exam) {
            throw new NotFoundHttpException('Không tìm thấy đề thi hoặc bạn không có quyền truy cập.');
        }

        return $exam;
    }

    /**
     * @param  array<string, mixed> $data
     * @param  Admin|Teacher|null   $user
     * @return Exam
     */
    public function createExam(array $data, Admin|Teacher|null $user = null): Exam
    {
        $allowedCenterIds = $this->getAllowedCenterIds($user);
        $centerId         = (int) ($data['center_id'] ?? ($user instanceof Teacher ? $user->center_id : 0));

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
            'center_id'             => $centerId,
            'subject_id'            => ! empty($data['subject_id']) ? (int) $data['subject_id'] : null,
            'class_id'              => ! empty($data['class_id']) ? (int) $data['class_id'] : null,
            'name'                  => trim($data['name']),
            'code'                  => $code,
            'exam_type_id'          => ! empty($data['exam_type_id']) ? (int) $data['exam_type_id'] : null,
            'description'           => $data['description'] ?? null,
            'duration_minutes'      => (int) ($data['duration_minutes'] ?? 45),
            'max_score'             => (float) ($data['max_score'] ?? 10.0),
            'pass_score'            => (float) ($data['pass_score'] ?? 5.0),
            'shuffle_questions'     => ! empty($data['shuffle_questions']),
            'shuffle_options'       => ! empty($data['shuffle_options']),
            'max_attempts'          => isset($data['max_attempts']) ? (int) $data['max_attempts'] : 1,
            'is_practice'           => ! empty($data['is_practice']),
            'status'                => $data['status'] ?? 'draft',
            'created_by_admin_id'   => $user instanceof Admin ? $user->id : null,
            'created_by_teacher_id' => $user instanceof Teacher ? $user->id : null,
        ];

        return DB::transaction(function () use ($payload, $data) {
            $exam = $this->examRepository->create($payload);

            // Đồng bộ phần thi & câu hỏi nếu có
            if (! empty($data['sections']) && is_array($data['sections'])) {
                $this->examRepository->syncSections($exam, $data['sections']);
            } elseif (! empty($data['questions']) && is_array($data['questions'])) {
                $this->examRepository->syncQuestions($exam, $data['questions']);
            }

            return $exam->fresh(['subject', 'examType', 'sections.questions']);
        });
    }

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @param  Admin|Teacher|null   $user
     * @return Exam
     */
    public function updateExam(int $id, array $data, Admin|Teacher|null $user = null): Exam
    {
        $exam = $this->findExam($id, $user);

        if (isset($data['center_id'])) {
            $centerId         = (int) $data['center_id'];
            $allowedCenterIds = $this->getAllowedCenterIds($user);

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
            'subject_id'        => isset($data['subject_id']) ? ($data['subject_id'] ? (int) $data['subject_id'] : null) : $exam->subject_id,
            'class_id'          => array_key_exists('class_id', $data) ? ($data['class_id'] ? (int) $data['class_id'] : null) : $exam->class_id,
            'name'              => isset($data['name']) ? trim($data['name']) : $exam->name,
            'code'              => $code,
            'exam_type_id'      => isset($data['exam_type_id']) ? (int) $data['exam_type_id'] : $exam->exam_type_id,
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

            return $updated->fresh(['subject', 'examType', 'sections.questions']);
        });
    }

    /**
     * @param  int                $id
     * @param  Admin|Teacher|null $user
     * @return bool
     */
    public function deleteExam(int $id, Admin|Teacher|null $user = null): bool
    {
        $exam = $this->findExam($id, $user);

        return $this->examRepository->delete($exam->id);
    }

    /**
     * @param  Admin|Teacher|null   $user
     * @return array<string, mixed>
     */
    public function getStats(Admin|Teacher|null $user = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($user);

        return $this->examRepository->getStats($allowedCenterIds);
    }
}

<?php

namespace App\Services\ClassExam;

use App\Models\Admin;
use App\Models\ClassExam;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\ClassExam\ClassExamRepositoryInterface;
use App\Repositories\Exam\ExamRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class ClassExamService implements ClassExamServiceInterface
{
    public function __construct(
        protected ClassExamRepositoryInterface $classExamRepository,
        protected CenterRepositoryInterface $centerRepository,
        protected SchoolClassRepositoryInterface $schoolClassRepository,
        protected ExamRepositoryInterface $examRepository
    ) {
    }

    public function getPaginatedClassExams(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $examId = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1,
        ?Admin $admin = null
    ): LengthAwarePaginator {
        return $this->classExamRepository->getPaginatedClassExams(
            $search,
            $centerId,
            $classId,
            $examId,
            $status,
            $perPage,
            $page,
            $admin
        );
    }

    public function findClassExam(int $id, ?Admin $admin = null): ClassExam
    {
        $classExam = $this->classExamRepository->findById($id, $admin);

        if (! $classExam) {
            throw new ModelNotFoundException("Không tìm thấy kỳ thi của lớp có ID #{$id}.");
        }

        return $classExam;
    }

    public function createClassExam(array $data, ?Admin $admin = null): ClassExam
    {
        return DB::transaction(function () use ($data, $admin) {
            // Lấy thông tin từ đề thi gốc qua Repository
            $exam = $this->examRepository->find($data['exam_id']);

            if (! $exam) {
                throw new ModelNotFoundException("Không tìm thấy đề thi gốc với ID #{$data['exam_id']}");
            }

            // Sinh mã kỳ thi nếu chưa có (CE000000001)
            $code = ! empty($data['code']) ? trim($data['code']) : $this->classExamRepository->getNextClassExamCode();

            // Sinh mã truy cập phòng thi 6 số ngẫu nhiên
            $accessCode = ! empty($data['access_code']) ? trim($data['access_code']) : str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

            // Tính toán valid_from và valid_to
            $examDate  = $data['exam_date'];
            $startTime = ! empty($data['start_time']) ? $data['start_time'] : '00:00:00';
            $endTime   = ! empty($data['end_time']) ? $data['end_time'] : '23:59:59';

            $validFrom = "{$examDate} {$startTime}";
            $validTo   = "{$examDate} {$endTime}";

            $payload = [
                'code'                => $code,
                'access_code'         => $accessCode,
                'class_id'            => $data['class_id'],
                'exam_id'             => $exam->id,
                'title'               => $data['title'],
                'exam_date'           => $examDate,
                'start_time'          => $data['start_time'] ?? null,
                'end_time'            => $data['end_time'] ?? null,
                'valid_from'          => $validFrom,
                'valid_to'            => $validTo,
                'duration_minutes'    => $data['duration_minutes'] ?? $exam->duration_minutes,
                'max_score'           => $data['max_score'] ?? $exam->max_score,
                'pass_score'          => $data['pass_score'] ?? $exam->pass_score,
                'status'              => $data['status'] ?? 'scheduled',
                'created_by_admin_id' => $admin?->id,
            ];

            return $this->classExamRepository->create($payload);
        });
    }

    public function updateClassExam(int $id, array $data, ?Admin $admin = null): ClassExam
    {
        $classExam = $this->findClassExam($id, $admin);

        return DB::transaction(function () use ($classExam, $data) {
            if (isset($data['exam_date'])) {
                $examDate  = $data['exam_date'];
                $startTime = ! empty($data['start_time']) ? $data['start_time'] : ($classExam->start_time ? $classExam->start_time->format('H:i:s') : '00:00:00');
                $endTime   = ! empty($data['end_time']) ? $data['end_time'] : ($classExam->end_time ? $classExam->end_time->format('H:i:s') : '23:59:59');

                $data['valid_from'] = "{$examDate} {$startTime}";
                $data['valid_to']   = "{$examDate} {$endTime}";
            }

            return $this->classExamRepository->update($classExam, $data);
        });
    }

    public function deleteClassExam(int $id, ?Admin $admin = null): bool
    {
        $classExam = $this->findClassExam($id, $admin);

        return DB::transaction(function () use ($classExam) {
            return $this->classExamRepository->delete($classExam);
        });
    }

    public function getFormData(?Admin $admin = null): array
    {
        $managedCenterIds = null;

        if ($admin && ! $admin->isSuperAdmin()) {
            $managedCenterIds = $admin->centers()->pluck('centers.id')->toArray();
        }

        return [
            'centers' => $this->centerRepository->getActiveCenters($managedCenterIds),
            'classes' => $this->schoolClassRepository->getClassesByCenterIds($managedCenterIds),
            'exams'   => $this->examRepository->getPublishedExamsForDropdown($managedCenterIds),
        ];
    }

    public function getStats(?Admin $admin = null): array
    {
        return $this->classExamRepository->getStats($admin);
    }
}

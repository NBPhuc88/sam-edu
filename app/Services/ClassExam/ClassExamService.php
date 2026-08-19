<?php

namespace App\Services\ClassExam;

use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassExam;
use App\Models\Exam;
use App\Models\SchoolClass;
use App\Repositories\ClassExam\ClassExamRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class ClassExamService implements ClassExamServiceInterface
{
    public function __construct(
        protected ClassExamRepositoryInterface $classExamRepository
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
            // Lấy thông tin từ đề thi gốc
            $exam = Exam::findOrFail($data['exam_id']);

            $payload = [
                'class_id'            => $data['class_id'],
                'exam_id'             => $exam->id,
                'title'               => $data['title'],
                'exam_date'           => $data['exam_date'],
                'start_time'          => $data['start_time'] ?? null,
                'end_time'            => $data['end_time'] ?? null,
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
        $centersQuery = Center::query()->where('status', 'active');
        $classesQuery = SchoolClass::query()->where('status', 'active');
        $examsQuery   = Exam::query()->where('status', 'published')->with(['subject', 'sections']);

        if ($admin && ! $admin->isSuperAdmin()) {
            $managedCenterIds = $admin->centers()->pluck('centers.id')->toArray();
            $centersQuery->whereIn('id', $managedCenterIds);
            $classesQuery->whereIn('center_id', $managedCenterIds);
            $examsQuery->whereIn('center_id', $managedCenterIds);
        }

        return [
            'centers' => $centersQuery->orderBy('name')->get(['id', 'name', 'code']),
            'classes' => $classesQuery->orderBy('name')->get(['id', 'center_id', 'name', 'code']),
            'exams'   => $examsQuery->orderBy('name')->get(['id', 'center_id', 'subject_id', 'name', 'code', 'exam_type', 'duration_minutes', 'max_score']),
        ];
    }

    public function getStats(?Admin $admin = null): array
    {
        return $this->classExamRepository->getStats($admin);
    }
}

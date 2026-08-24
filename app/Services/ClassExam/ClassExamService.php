<?php

namespace App\Services\ClassExam;

use App\Mail\ClassExamCreatedMail;
use App\Models\Admin;
use App\Models\ClassExam;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\ClassExam\ClassExamRepositoryInterface;
use App\Repositories\Exam\ExamRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

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
        ?Admin $admin = null,
        ?Teacher $teacher = null
    ): LengthAwarePaginator {
        return $this->classExamRepository->getPaginatedClassExams(
            $search,
            $centerId,
            $classId,
            $examId,
            $status,
            $perPage,
            $page,
            $admin,
            $teacher
        );
    }

    public function findClassExam(int $id, ?Admin $admin = null, ?Teacher $teacher = null): ClassExam
    {
        $classExam = $this->classExamRepository->findById($id, $admin, $teacher);

        if (! $classExam) {
            throw new NotFoundHttpException("Không tìm thấy kỳ thi của lớp có ID #{$id} hoặc bạn không có quyền truy cập.");
        }

        return $classExam;
    }

    public function createClassExam(array $data, ?Admin $admin = null, ?Teacher $teacher = null): ClassExam
    {
        return DB::transaction(function () use ($data, $admin, $teacher) {
            // Nếu là giáo viên, kiểm tra xem có dạy lớp này không
            if ($teacher) {
                $isAssigned = $this->schoolClassRepository->isTeacherAssignedToClass($teacher->id, (int) $data['class_id']);

                if (! $isAssigned) {
                    throw new AccessDeniedHttpException('Bạn không có quyền tạo kỳ thi cho lớp học này.');
                }
            }

            // Lấy thông tin từ đề thi gốc qua Repository
            $exam = $this->examRepository->find($data['exam_id']);

            if (! $exam) {
                throw new NotFoundHttpException("Không tìm thấy đề thi gốc với ID #{$data['exam_id']}");
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
                'code'                  => $code,
                'access_code'           => $accessCode,
                'class_id'              => $data['class_id'],
                'exam_id'               => $exam->id,
                'title'                 => $data['title'],
                'exam_date'             => $examDate,
                'start_time'            => $data['start_time'] ?? null,
                'end_time'              => $data['end_time'] ?? null,
                'valid_from'            => $validFrom,
                'valid_to'              => $validTo,
                'duration_minutes'      => $data['duration_minutes'] ?? $exam->duration_minutes,
                'max_score'             => $data['max_score'] ?? $exam->max_score,
                'pass_score'            => $data['pass_score'] ?? $exam->pass_score,
                'status'                => $data['status'] ?? 'scheduled',
                'created_by_admin_id'   => $admin?->id,
                'created_by_teacher_id' => $teacher?->id,
            ];

            $classExam = $this->classExamRepository->create($payload);

            // Gửi email thông báo kỳ thi qua Queue cho học sinh và giáo viên phụ trách lớp
            $schoolClass = SchoolClass::with(['students' => function ($q) {
                $q->wherePivot('status', 1)->where('students.status', 1);
            }, 'classSubjects.teacher'])->find($data['class_id']);

            if ($schoolClass) {
                // 1. Gửi cho tất cả học sinh đang học trong lớp
                foreach ($schoolClass->students as $student) {
                    if (! empty($student->email)) {
                        Mail::to($student->email)->queue(
                            new ClassExamCreatedMail(
                                classExam: $classExam,
                                recipientName: $student->full_name,
                                recipientRole: 'student'
                            )
                        );
                    }
                }

                // 2. Gửi cho tất cả giáo viên phụ trách môn/lớp
                $teachers = $schoolClass->classSubjects
                    ->pluck('teacher')
                    ->filter()
                    ->unique('id');

                foreach ($teachers as $t) {
                    if (! empty($t->email)) {
                        Mail::to($t->email)->queue(
                            new ClassExamCreatedMail(
                                classExam: $classExam,
                                recipientName: $t->full_name,
                                recipientRole: 'teacher'
                            )
                        );
                    }
                }
            }

            return $classExam;
        });
    }

    public function updateClassExam(int $id, array $data, ?Admin $admin = null, ?Teacher $teacher = null): ClassExam
    {
        $classExam = $this->findClassExam($id, $admin, $teacher);

        return DB::transaction(function () use ($classExam, $data, $teacher) {
            if ($teacher && isset($data['class_id']) && (int) $data['class_id'] !== (int) $classExam->class_id) {
                $isAssigned = $this->schoolClassRepository->isTeacherAssignedToClass($teacher->id, (int) $data['class_id']);

                if (! $isAssigned) {
                    throw new AccessDeniedHttpException('Bạn không có quyền chuyển kỳ thi sang lớp học này.');
                }
            }

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

    public function deleteClassExam(int $id, ?Admin $admin = null, ?Teacher $teacher = null): bool
    {
        $classExam = $this->findClassExam($id, $admin, $teacher);

        return DB::transaction(function () use ($classExam) {
            return $this->classExamRepository->delete($classExam);
        });
    }

    public function getFormData(?Admin $admin = null, ?Teacher $teacher = null): array
    {
        if ($teacher) {
            $teacherClassIds  = $teacher->classSubjects()->pluck('class_id')->unique()->toArray();
            $classes          = $this->schoolClassRepository->getByIds($teacherClassIds, ['id', 'name', 'code', 'center_id']);
            $managedCenterIds = $teacher->center_id ? [(int) $teacher->center_id] : null;

            return [
                'centers' => $this->centerRepository->getActiveCenters($managedCenterIds),
                'classes' => $classes,
                'exams'   => $this->examRepository->getPublishedExamsForDropdown($managedCenterIds),
            ];
        }

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

    public function getStats(?Admin $admin = null, ?Teacher $teacher = null): array
    {
        return $this->classExamRepository->getStats($admin, $teacher);
    }
}

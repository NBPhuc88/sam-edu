<?php

namespace App\Services\ClassExam;

use App\Enums\Constant;
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
use Illuminate\Support\Carbon;
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
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
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
            $examDate  = Carbon::parse($data['exam_date'])->format('Y-m-d');
            $startTime = ! empty($data['start_time']) ? $data['start_time'] : '00:00:00';
            $endTime   = ! empty($data['end_time']) ? $data['end_time'] : '23:59:59';

            if (strlen($startTime) === 5) {
                $startTime .= ':00';
            }

            if (strlen($endTime) === 5) {
                $endTime .= ':00';
            }

            $validFrom = Carbon::parse("{$examDate} {$startTime}")->format('Y-m-d H:i:s');
            $validTo   = Carbon::parse("{$examDate} {$endTime}")->format('Y-m-d H:i:s');

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
                'status'                => $data['status'] ?? Constant::CLASS_EXAM_STATUS_SCHEDULED,
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

            $rawDate = $data['exam_date'] ?? $classExam->exam_date;

            if ($rawDate) {
                $examDate          = Carbon::parse($rawDate)->format('Y-m-d');
                $data['exam_date'] = $examDate;

                $startTime = ! empty($data['start_time'])
                    ? $data['start_time']
                    : ($classExam->start_time ? (is_string($classExam->start_time) ? $classExam->start_time : $classExam->start_time->format('H:i:s')) : '00:00:00');
                $endTime = ! empty($data['end_time'])
                    ? $data['end_time']
                    : ($classExam->end_time ? (is_string($classExam->end_time) ? $classExam->end_time : $classExam->end_time->format('H:i:s')) : '23:59:59');

                if (strlen($startTime) === 5) {
                    $startTime .= ':00';
                }

                if (strlen($endTime) === 5) {
                    $endTime .= ':00';
                }

                $data['valid_from'] = Carbon::parse("{$examDate} {$startTime}")->format('Y-m-d H:i:s');
                $data['valid_to']   = Carbon::parse("{$examDate} {$endTime}")->format('Y-m-d H:i:s');
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

    /**
     * Tự động quét và cập nhật trạng thái các kỳ thi lớp (ClassExam).
     * - scheduled -> ongoing: nếu now + 5 phút >= valid_from và now < valid_to
     * - ongoing/scheduled -> completed: nếu now >= valid_to
     *
     * @return array{ongoing: int, completed: int}
     */
    public function autoUpdateClassExamStatuses(): array
    {
        $now        = Carbon::now();
        $in5Minutes = $now->copy()->addMinutes(5)->format('Y-m-d H:i:s');
        $nowString  = $now->format('Y-m-d H:i:s');

        // 1. Chuyển các kỳ thi 'scheduled' sang 'ongoing' nếu thời gian hiện tại + 5p >= valid_from và chưa quá valid_to
        $ongoingCount = ClassExam::where('status', Constant::CLASS_EXAM_STATUS_SCHEDULED)
            ->whereNotNull('valid_from')
            ->where('valid_from', '<=', $in5Minutes)
            ->where(function ($q) use ($nowString) {
                $q->whereNull('valid_to')->orWhere('valid_to', '>', $nowString);
            })
            ->update(['status' => Constant::CLASS_EXAM_STATUS_ONGOING]);

        // 2. Chuyển các kỳ thi 'ongoing' hoặc 'scheduled' sang 'completed' nếu đã quá valid_to
        $completedCount = ClassExam::whereIn('status', [Constant::CLASS_EXAM_STATUS_SCHEDULED, Constant::CLASS_EXAM_STATUS_ONGOING])
            ->whereNotNull('valid_to')
            ->where('valid_to', '<=', $nowString)
            ->update(['status' => Constant::CLASS_EXAM_STATUS_COMPLETED]);

        return [
            'ongoing'   => $ongoingCount,
            'completed' => $completedCount,
        ];
    }
}

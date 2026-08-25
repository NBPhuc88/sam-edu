<?php

namespace App\Services\Attendance;

use App\Models\Admin;
use App\Models\ClassSession;
use App\Models\Teacher;
use App\Repositories\Attendance\AttendanceRepositoryInterface;
use App\Repositories\Session\ClassSessionRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AttendanceService implements AttendanceServiceInterface
{
    public function __construct(
        protected AttendanceRepositoryInterface $attendanceRepository,
        protected ClassSessionRepositoryInterface $sessionRepository
    ) {
    }

    /**
     * @param  int                  $sessionId
     * @param  Admin|Teacher|null   $user
     * @return array<string, mixed>
     */
    public function getSessionAttendanceData(int $sessionId, Admin|Teacher|null $user = null): array
    {
        $session = $this->attendanceRepository->findSession($sessionId);

        if (! $session) {
            throw new NotFoundHttpException("Không tìm thấy ca học với ID #{$sessionId}");
        }

        // Check permissions if needed
        if ($user instanceof Admin && ! $user->isSuperAdmin()) {
            $allowedCenterIds = $user->centers()->pluck('centers.id')->toArray();
            $centerId         = $session->classSubject?->schoolClass?->center_id;

            if ($centerId && ! in_array($centerId, $allowedCenterIds, true)) {
                throw new NotFoundHttpException('Không tìm thấy ca học hoặc bạn không có quyền truy cập.');
            }
        } elseif ($user instanceof Teacher) {
            $assignedTeacherId = $session->teacher_id ?: $session->classSubject?->teacher_id;

            if ((int) $assignedTeacherId !== (int) $user->id) {
                throw new NotFoundHttpException('Không tìm thấy ca học hoặc bạn không có quyền truy cập.');
            }
        }

        // Students in the class
        $students = $session->classSubject?->schoolClass?->students ?? collect();

        // Index existing attendances by student_id
        $existingAttendances = $session->attendances->keyBy('student_id');

        $studentAttendanceList = $students->map(function ($student) use ($existingAttendances) {
            $att = $existingAttendances->get($student->id);

            return [
                'id'                   => $student->id,
                'full_name'            => $student->full_name,
                'student_code'         => $student->student_code,
                'phone'                => $student->phone,
                'email'                => $student->email,
                'parent_phone'         => $student->parent_phone,
                'gender'               => $student->gender,
                'status'               => $att ? $att->status : 'present',
                'note'                 => $att ? $att->note : '',
                'check_in_at'          => $att?->check_in_at?->format('d-m-Y H:i'),
                'marked_by_teacher_id' => $att?->marked_by_teacher_id,
                'marked_by_admin_id'   => $att?->marked_by_admin_id,
                'marked_at'            => $att?->marked_at?->format('d-m-Y H:i'),
            ];
        });

        // Compute session number
        $sessionOrder = $this->sessionRepository->countPastSessions(
            (int) $session->class_subject_id,
            $session->session_date ? (string) $session->session_date : now()->toDateString(),
            $session->start_time
        );

        return [
            'session'       => $session,
            'schoolClass'   => $session->classSubject?->schoolClass,
            'subject'       => $session->classSubject?->subject,
            'teacher'       => $session->teacher ?? $session->classSubject?->teacher,
            'room'          => $session->room,
            'sessionOrder'  => $sessionOrder,
            'totalSessions' => $session->classSubject?->subject?->total_sessions,
            'students'      => $studentAttendanceList,
            'totalStudents' => $students->count(),
            'presentCount'  => $studentAttendanceList->where('status', 'present')->count(),
            'absentCount'   => $studentAttendanceList->where('status', 'absent')->count(),
            'lateCount'     => $studentAttendanceList->where('status', 'late')->count(),
            'excusedCount'  => $studentAttendanceList->where('status', 'excused')->count(),
        ];
    }

    /**
     * @param  int                                                                $sessionId
     * @param  array<int, array{student_id: int, status: string, note?: ?string}> $attendances
     * @param  Admin|Teacher|null                                                 $user
     * @return bool
     */
    public function saveAttendance(int $sessionId, array $attendances, Admin|Teacher|null $user = null): bool
    {
        $session = $this->attendanceRepository->findSession($sessionId);

        if (! $session) {
            throw new NotFoundHttpException("Không tìm thấy ca học với ID #{$sessionId}");
        }

        // Check permissions
        if ($user instanceof Admin && ! $user->isSuperAdmin()) {
            $allowedCenterIds = $user->centers()->pluck('centers.id')->toArray();
            $centerId         = $session->classSubject?->schoolClass?->center_id;

            if ($centerId && ! in_array($centerId, $allowedCenterIds, true)) {
                throw new NotFoundHttpException('Không tìm thấy ca học hoặc bạn không có quyền truy cập.');
            }
        } elseif ($user instanceof Teacher) {
            $assignedTeacherId = $session->teacher_id ?: $session->classSubject?->teacher_id;

            if ((int) $assignedTeacherId !== (int) $user->id) {
                throw new NotFoundHttpException('Không tìm thấy ca học hoặc bạn không có quyền truy cập.');
            }
        }

        if (in_array($session->status, ['cancelled', 'rescheduled'], true)) {
            throw ValidationException::withMessages([
                'session' => 'Không thể điểm danh ca học đã bị hủy hoặc đã đổi lịch.',
            ]);
        }

        $sessionDate   = $session->getRawOriginal('session_date') ?? (is_string($session->session_date) ? $session->session_date : $session->session_date->toDateString());
        $sessionStart  = Carbon::parse($sessionDate . ' ' . $session->start_time);
        $isBeforeStart = $sessionStart->isFuture();

        if ($isBeforeStart) {
            throw ValidationException::withMessages([
                'session' => 'Chưa thể điểm danh trước khi buổi học bắt đầu.',
            ]);
        }

        $markedByTeacherId = ($user instanceof Teacher) ? $user->id : null;
        $markedByAdminId   = ($user instanceof Admin) ? $user->id : null;

        $result = $this->attendanceRepository->saveSessionAttendances(
            $sessionId,
            $attendances,
            $markedByTeacherId,
            $markedByAdminId
        );

        // Update session status to completed if not already
        if ($session->status !== 'completed') {
            $session->update(['status' => 'completed']);
        }

        return $result;
    }

    /**
     * @param  int                $sessionId
     * @param  Admin|Teacher|null $user
     * @return bool
     */
    public function resetAttendance(int $sessionId, Admin|Teacher|null $user = null): bool
    {
        $session = $this->attendanceRepository->findSession($sessionId);

        if (! $session) {
            throw new NotFoundHttpException("Không tìm thấy ca học với ID #{$sessionId}");
        }

        // Check permissions
        if ($user instanceof Admin && ! $user->isSuperAdmin()) {
            $allowedCenterIds = $user->centers()->pluck('centers.id')->toArray();
            $centerId         = $session->classSubject?->schoolClass?->center_id;

            if ($centerId && ! in_array($centerId, $allowedCenterIds, true)) {
                throw new NotFoundHttpException('Không tìm thấy ca học hoặc bạn không có quyền truy cập.');
            }
        } elseif ($user instanceof Teacher) {
            $assignedTeacherId = $session->teacher_id ?: $session->classSubject?->teacher_id;

            if ((int) $assignedTeacherId !== (int) $user->id) {
                throw new NotFoundHttpException('Không tìm thấy ca học hoặc bạn không có quyền truy cập.');
            }
        }

        return $this->attendanceRepository->resetSessionAttendance($sessionId);
    }

    /**
     * @param  int           $teacherId
     * @return ?ClassSession
     */
    public function getTodayTeacherSession(int $teacherId): ?ClassSession
    {
        return $this->sessionRepository->getTodaySessionByTeacher($teacherId);
    }
}

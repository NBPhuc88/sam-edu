<?php

namespace App\Services\Attendance;

use App\Models\Admin;
use App\Models\ClassSession;
use App\Models\Teacher;
use App\Repositories\Attendance\AttendanceRepositoryInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AttendanceService implements AttendanceServiceInterface
{
    public function __construct(
        protected AttendanceRepositoryInterface $attendanceRepository
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
                throw new AccessDeniedHttpException('Bạn không có quyền truy cập ca học này.');
            }
        } elseif ($user instanceof Teacher) {
            $assignedTeacherId = $session->teacher_id ?? $session->classSubject?->teacher_id;

            if ($assignedTeacherId !== $user->id) {
                // If it's another teacher, allow viewing if same center or restrict
                if ($session->classSubject?->schoolClass?->center_id !== $user->center_id) {
                    throw new AccessDeniedHttpException('Bạn không có quyền truy cập ca học này.');
                }
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
                'check_in_at'          => $att?->check_in_at?->format('H:i d/m/Y'),
                'marked_by_teacher_id' => $att?->marked_by_teacher_id,
                'marked_by_admin_id'   => $att?->marked_by_admin_id,
                'marked_at'            => $att?->marked_at?->format('H:i d/m/Y'),
            ];
        });

        // Compute session number
        $sessionOrder = ClassSession::where('class_subject_id', $session->class_subject_id)
            ->where(function ($q) use ($session) {
                $q->where('session_date', '<', $session->session_date)
                    ->orWhere(function ($sq) use ($session) {
                        $sq->where('session_date', $session->session_date)
                            ->where('start_time', '<=', $session->start_time);
                    });
            })
            ->count();

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
}

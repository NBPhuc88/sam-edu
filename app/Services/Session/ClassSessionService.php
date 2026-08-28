<?php

namespace App\Services\Session;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\ClassSession;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Room\RoomRepositoryInterface;
use App\Repositories\Session\ClassSessionRepositoryInterface;
use App\Repositories\Subject\SubjectRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ClassSessionService implements ClassSessionServiceInterface
{
    public function __construct(
        protected ClassSessionRepositoryInterface $sessionRepository,
        protected CenterRepositoryInterface $centerRepository,
        protected SchoolClassRepositoryInterface $schoolClassRepository,
        protected SubjectRepositoryInterface $subjectRepository,
        protected TeacherRepositoryInterface $teacherRepository,
        protected RoomRepositoryInterface $roomRepository
    ) {
    }

    /**
     * Resolve allowed center IDs for the user
     *
     * @param  Admin|Teacher|null $user
     * @return array<int>|null
     */
    protected function getAllowedCenterIds(Admin|Teacher|null $user): ?array
    {
        if ($user instanceof Admin) {
            if ($user->isSuperAdmin()) {
                return null;
            }

            return $user->centers()->pluck('centers.id')->toArray();
        }

        if ($user instanceof Teacher) {
            return $user->center_id ? [(int) $user->center_id] : [];
        }

        return null;
    }

    /**
     * @param  ?string              $search
     * @param  ?int                 $centerId
     * @param  ?int                 $classId
     * @param  ?int                 $subjectId
     * @param  ?int                 $teacherId
     * @param  ?int                 $roomId
     * @param  ?string              $sessionDate
     * @param  ?string              $dateFrom
     * @param  ?string              $dateTo
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  Admin|Teacher|null   $user
     * @param  ?string              $dateScope
     * @return LengthAwarePaginator
     */
    public function getPaginatedSessions(
        ?string $search = null,
        ?int $centerId = null,
        ?int $classId = null,
        ?int $subjectId = null,
        ?int $teacherId = null,
        ?int $roomId = null,
        ?string $sessionDate = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $status = null,
        int $perPage = 20,
        int $page = 1,
        Admin|Teacher|null $user = null,
        ?string $dateScope = null
    ): LengthAwarePaginator {
        $allowedCenterIds = $this->getAllowedCenterIds($user);

        // If specific center requested, verify permission
        $finalCenterIds = $allowedCenterIds;

        if ($centerId !== null) {
            if ($allowedCenterIds === null) {
                $finalCenterIds = [$centerId];
            } elseif (in_array($centerId, $allowedCenterIds, true)) {
                $finalCenterIds = [$centerId];
            } else {
                $finalCenterIds = [-1]; // No access
            }
        }

        // If teacher is logged in, default teacher filter to their ID unless overridden by admin
        $finalTeacherId = $teacherId;

        if ($user instanceof Teacher && $finalTeacherId === null) {
            $finalTeacherId = $user->id;
        }

        // Xử lý phạm vi ngày: mặc định là từ hôm nay đến tương lai nếu không chọn ngày cụ thể
        $finalDateFrom = $dateFrom;
        $finalDateTo   = $dateTo;

        $effectiveScope = $dateScope ?? 'from_today';

        if ($effectiveScope === 'from_today' && empty($sessionDate) && empty($dateFrom) && empty($dateTo)) {
            $finalDateFrom = Carbon::today()->toDateString();
        }

        return $this->sessionRepository->paginate(
            $search,
            $finalCenterIds,
            $classId,
            $subjectId,
            $finalTeacherId,
            $roomId,
            $sessionDate,
            $finalDateFrom,
            $finalDateTo,
            $status,
            $perPage,
            $page
        );
    }

    /**
     * @param  int                $id
     * @param  Admin|Teacher|null $user
     * @return ClassSession
     */
    public function findSessionDetails(int $id, Admin|Teacher|null $user = null): ClassSession
    {
        $session = $this->sessionRepository->findWithDetails($id);

        if (! $session) {
            throw new NotFoundHttpException("Không tìm thấy buổi học #{$id}");
        }

        $this->authorizeSessionAccess($session, $user);

        return $session;
    }

    /**
     * @param  int                $id
     * @param  array              $data
     * @param  Admin|Teacher|null $user
     * @return ClassSession
     */
    public function updateOrRescheduleSession(int $id, array $data, Admin|Teacher|null $user = null): ClassSession
    {
        $session = $this->sessionRepository->findWithDetails($id);

        if (! $session) {
            throw new NotFoundHttpException("Không tìm thấy buổi học #{$id}");
        }

        $this->authorizeSessionAccess($session, $user);

        // Store old values for reschedule comparison
        $oldDate      = $session->session_date ? Carbon::parse($session->session_date)->format('Y-m-d') : null;
        $oldStartTime = $session->start_time;
        $oldEndTime   = $session->end_time;
        $oldRoomId    = $session->room_id;
        $oldTeacherId = $session->teacher_id ?: $session->classSubject?->teacher_id;

        $newDate      = $data['session_date'] ?? $oldDate;
        $newStartTime = $data['start_time'] ?? $oldStartTime;
        $newEndTime   = $data['end_time'] ?? $oldEndTime;
        $newRoomId    = array_key_exists('room_id', $data) ? ($data['room_id'] ? (int) $data['room_id'] : null) : $oldRoomId;
        $newTeacherId = array_key_exists('teacher_id', $data) ? ($data['teacher_id'] ? (int) $data['teacher_id'] : null) : $oldTeacherId;

        $hasScheduleChanged = ($oldDate !== $newDate)
            || ($oldStartTime !== $newStartTime)
            || ($oldEndTime !== $newEndTime)
            || ($oldRoomId !== $newRoomId)
            || ($oldTeacherId !== $newTeacherId);

        // Kiểm tra trùng lịch với các môn học khác trong cùng lớp hoặc trùng lịch dạy của giáo viên nếu thay đổi ngày / giờ / giáo viên
        if ($hasScheduleChanged && $newDate && $newStartTime && $newEndTime) {
            $cleanNewStart = substr((string) $newStartTime, 0, 5);
            $cleanNewEnd   = substr((string) $newEndTime, 0, 5);
            $formattedDate = Carbon::parse($newDate)->format('d/m/Y');

            $schoolClass   = $session->classSubject?->schoolClass;
            $classStartIso = ($schoolClass && $schoolClass->start_date) ? Carbon::parse($schoolClass->start_date)->format('Y-m-d') : null;
            $todayIso      = now()->toDateString();
            $minDateIso    = ($classStartIso && $classStartIso > $todayIso) ? $classStartIso : $todayIso;
            $newDateIso    = Carbon::parse($newDate)->format('Y-m-d');

            if ($newDateIso < $minDateIso) {
                $minDateFormatted = Carbon::parse($minDateIso)->format('d/m/Y');

                throw ValidationException::withMessages([
                    'session_date' => "Ngày học ({$formattedDate}) không được nhỏ hơn ngày hiện tại ({$minDateFormatted}).",
                ]);
            }

            $classId = $session->classSubject?->class_id;

            if ($classId) {
                $conflictSession = ClassSession::query()
                    ->where('id', '!=', $session->id)
                    ->where('session_date', $newDate)
                    ->where('status', '!=', 'cancelled')
                    ->whereHas('classSubject', function ($q) use ($classId) {
                        $q->where('class_id', $classId);
                    })
                    ->where('start_time', '<', $cleanNewEnd)
                    ->where('end_time', '>', $cleanNewStart)
                    ->with(['classSubject.subject:id,name', 'classSubject.schoolClass:id,name'])
                    ->first();

                if ($conflictSession) {
                    $otherSubjectName = $conflictSession->classSubject?->subject?->name ?? 'môn học khác';
                    $className        = $conflictSession->classSubject?->schoolClass?->name ?? 'Lớp học';
                    $cStart           = substr((string) $conflictSession->start_time, 0, 5);
                    $cEnd             = substr((string) $conflictSession->end_time, 0, 5);

                    throw ValidationException::withMessages([
                        'session_date' => "Trùng lịch học trong {$className}: Khung giờ {$cleanNewStart} - {$cleanNewEnd} ngày {$formattedDate} bị trùng với ca học môn '{$otherSubjectName}' ({$cStart} - {$cEnd}).",
                    ]);
                }
            }

            // Kiểm tra trùng lịch dạy của giáo viên ở các lớp khác
            $effectiveTeacherId = $newTeacherId ?: $oldTeacherId;

            if ($effectiveTeacherId) {
                $teacherConflict = ClassSession::query()
                    ->where('id', '!=', $session->id)
                    ->where('teacher_id', $effectiveTeacherId)
                    ->where('session_date', $newDate)
                    ->where('status', '!=', 'cancelled')
                    ->where('start_time', '<', $cleanNewEnd)
                    ->where('end_time', '>', $cleanNewStart)
                    ->with([
                        'classSubject.subject:id,name',
                        'classSubject.schoolClass:id,name',
                        'teacher:id,full_name,teacher_code',
                    ])
                    ->first();

                if ($teacherConflict) {
                    $teacherName      = $teacherConflict->teacher?->full_name ?? 'Giáo viên';
                    $otherSubjectName = $teacherConflict->classSubject?->subject?->name ?? 'môn học';
                    $otherClassName   = $teacherConflict->classSubject?->schoolClass?->name ?? 'lớp khác';
                    $cStart           = substr((string) $teacherConflict->start_time, 0, 5);
                    $cEnd             = substr((string) $teacherConflict->end_time, 0, 5);

                    throw ValidationException::withMessages([
                        'teacher_id' => "Trùng lịch dạy của giáo viên: Giáo viên '{$teacherName}' đã có ca dạy môn '{$otherSubjectName}' tại {$otherClassName} vào ngày {$formattedDate} lúc {$cStart} - {$cEnd}.",
                    ]);
                }
            }
        }

        // If schedule or teacher/room changed, record a reschedule log
        if ($hasScheduleChanged) {
            $reason = $data['reason'] ?? 'Cập nhật / Đổi lịch buổi học';

            $this->sessionRepository->createRescheduleLog([
                'session_id'            => $session->id,
                'old_date'              => $oldDate,
                'old_start_time'        => $oldStartTime,
                'old_end_time'          => $oldEndTime,
                'old_room_id'           => $oldRoomId,
                'old_teacher_id'        => $oldTeacherId,
                'new_date'              => $newDate,
                'new_start_time'        => $newStartTime,
                'new_end_time'          => $newEndTime,
                'new_room_id'           => $newRoomId,
                'new_teacher_id'        => $newTeacherId,
                'reason'                => $reason,
                'changed_by_admin_id'   => ($user instanceof Admin) ? $user->id : null,
                'changed_by_teacher_id' => ($user instanceof Teacher) ? $user->id : null,
                'changed_at'            => now(),
            ]);
        }

        // Prepare update attributes for ClassSession
        $updateData = [
            'session_date' => $newDate,
            'start_time'   => $newStartTime,
            'end_time'     => $newEndTime,
            'room_id'      => $newRoomId,
            'teacher_id'   => $newTeacherId,
        ];

        if (isset($data['status'])) {
            $updateData['status'] = $data['status'];
        } elseif ($hasScheduleChanged && ($session->status === Constant::SESSION_STATUS_CANCELLED || (int) $session->status === Constant::SESSION_STATUS_SCHEDULED)) {
            $updateData['status'] = Constant::SESSION_STATUS_SCHEDULED;
        }

        if (array_key_exists('topic', $data)) {
            $updateData['topic'] = $data['topic'];
        }

        if (array_key_exists('note', $data)) {
            $updateData['note'] = $data['note'];
        }

        return $this->sessionRepository->update($id, $updateData);
    }

    /**
     * @param  ClassSession       $session
     * @param  Admin|Teacher|null $user
     * @return void
     */
    protected function authorizeSessionAccess(ClassSession $session, Admin|Teacher|null $user): void
    {
        if ($user instanceof Admin) {
            if (! $user->isSuperAdmin()) {
                $allowed  = $this->getAllowedCenterIds($user) ?? [];
                $centerId = $session->classSubject?->schoolClass?->center_id;

                if ($centerId && ! in_array($centerId, $allowed, true)) {
                    throw new NotFoundHttpException('Không tìm thấy buổi học hoặc bạn không có quyền truy cập.');
                }
            }
        } elseif ($user instanceof Teacher) {
            $assignedTeacherId = $session->teacher_id ?: $session->classSubject?->teacher_id;

            if ((int) $assignedTeacherId !== (int) $user->id) {
                throw new NotFoundHttpException('Không tìm thấy buổi học hoặc bạn không có quyền truy cập.');
            }
        }
    }

    /**
     * @param  Admin|Teacher|null   $user
     * @return array<string, mixed>
     */
    public function getFilterFormData(Admin|Teacher|null $user = null): array
    {
        if ($user instanceof Teacher) {
            $teacherClassIds   = $user->classSubjects()->pluck('class_id')->unique()->toArray();
            $teacherSubjectIds = $user->classSubjects()->pluck('subject_id')->unique()->toArray();
            $allowedCenterIds  = $user->center_id ? [(int) $user->center_id] : [];

            return [
                'centers'  => $this->centerRepository->getActiveCenters($allowedCenterIds),
                'classes'  => SchoolClass::whereIn('id', $teacherClassIds)->get(['id', 'name', 'code', 'center_id']),
                'subjects' => Subject::whereIn('id', $teacherSubjectIds)->get(['id', 'name', 'code', 'center_id']),
                'teachers' => [],
                'rooms'    => [],
            ];
        }

        $allowedCenterIds = $this->getAllowedCenterIds($user);

        return [
            'centers'  => $this->centerRepository->getActiveCenters($allowedCenterIds),
            'classes'  => $this->schoolClassRepository->getClassesByCenterIds($allowedCenterIds),
            'subjects' => $this->subjectRepository->getByCenterIds($allowedCenterIds),
            'teachers' => $this->teacherRepository->getActiveTeachers($allowedCenterIds, ['id', 'full_name', 'teacher_code', 'center_id']),
            'rooms'    => $this->roomRepository->getByCenterIds($allowedCenterIds),
        ];
    }

    /**
     * Tự động quét và cập nhật trạng thái các ca học theo thời gian thực.
     *
     * @return array{in_progress: int, completed: int, unattended: int}
     */
    public function autoUpdateSessionStatuses(): array
    {
        $today       = now()->toDateString();
        $currentTime = now()->toTimeString();

        // 1. Chuyển các ca học đang trong giờ học hôm nay sang 'in_progress'
        $inProgressCount = $this->sessionRepository->updateSessionsToInProgress($today, $currentTime);

        // 2. Chuyển các ca học đã kết thúc và đã điểm danh sang 'completed'
        $completedCount = $this->sessionRepository->updateEndedAttendedSessionsToCompleted($today, $currentTime);

        // 3. Chuyển các ca học đã kết thúc nhưng chưa điểm danh sang 'unattended'
        $unattendedCount = $this->sessionRepository->updateEndedUnattendedSessions($today, $currentTime);

        return [
            'in_progress' => $inProgressCount,
            'completed'   => $completedCount,
            'unattended'  => $unattendedCount,
        ];
    }
}

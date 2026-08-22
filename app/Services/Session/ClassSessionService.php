<?php

namespace App\Services\Session;

use App\Models\Admin;
use App\Models\ClassSession;
use App\Models\Teacher;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Room\RoomRepositoryInterface;
use App\Repositories\Session\ClassSessionRepositoryInterface;
use App\Repositories\Subject\SubjectRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
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
        Admin|Teacher|null $user = null
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

        return $this->sessionRepository->paginate(
            $search,
            $finalCenterIds,
            $classId,
            $subjectId,
            $finalTeacherId,
            $roomId,
            $sessionDate,
            $dateFrom,
            $dateTo,
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
        $oldTeacherId = $session->teacher_id;

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

        // If schedule or teacher/room changed, record a reschedule log
        if ($hasScheduleChanged) {
            $reason = $data['reason'] ?? 'Cập nhật / Đổi lịch buổi học';

            $this->sessionRepository->createRescheduleLog([
                'session_id'            => $session->id,
                'old_date'              => $oldDate,
                'old_start_time'        => $oldStartTime,
                'old_end_time'          => $oldEndTime,
                'old_room_id'           => $oldRoomId,
                'new_date'              => $newDate,
                'new_start_time'        => $newStartTime,
                'new_end_time'          => $newEndTime,
                'new_room_id'           => $newRoomId,
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
        } elseif ($hasScheduleChanged && ($session->status === 'rescheduled' || $session->status === 'scheduled')) {
            $updateData['status'] = 'scheduled';
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
                    throw new AccessDeniedHttpException('Bạn không có quyền truy cập buổi học này.');
                }
            }
        } elseif ($user instanceof Teacher) {
            $centerId = $session->classSubject?->schoolClass?->center_id;

            if ($centerId && $centerId !== (int) $user->center_id) {
                throw new AccessDeniedHttpException('Bạn không có quyền truy cập buổi học này.');
            }
        }
    }

    /**
     * @param  Admin|Teacher|null   $user
     * @return array<string, mixed>
     */
    public function getFilterFormData(Admin|Teacher|null $user = null): array
    {
        $allowedCenterIds = $this->getAllowedCenterIds($user);

        return [
            'centers'  => $this->centerRepository->getActiveCenters($allowedCenterIds),
            'classes'  => $this->schoolClassRepository->getClassesByCenterIds($allowedCenterIds),
            'subjects' => $this->subjectRepository->getByCenterIds($allowedCenterIds),
            'teachers' => $this->teacherRepository->getActiveTeachers($allowedCenterIds, ['id', 'full_name', 'teacher_code', 'center_id']),
            'rooms'    => $this->roomRepository->getByCenterIds($allowedCenterIds),
        ];
    }
}

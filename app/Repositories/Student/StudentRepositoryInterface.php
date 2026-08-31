<?php

namespace App\Repositories\Student;

use App\Enums\Constant;
use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface StudentRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Student;

    /**
     * @param  ?int                     $centerId
     * @param  ?int                     $classId
     * @return \Generator<int, Student>
     */
    public function getStudentsCursor(?int $centerId = null, ?int $classId = null): \Generator;

    public function findByCode(string $studentCode): ?Student;

    /**
     * @param string               $studentCode
     * @param array<string, mixed> $data
     */
    public function updateOrCreateByCode(string $studentCode, array $data): Student;

    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?int                 $classId
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @param  array<int>|null      $allowedClassIds
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?int $classId = null,
        ?string $status = null,
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE,
        ?array $allowedClassIds = null
    ): LengthAwarePaginator;

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Student|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Student;

    /**
     * @param  array<string, mixed> $data
     * @return Student
     */
    public function create(array $data): Student;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Student
     */
    public function update(int $id, array $data): Student;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    public function count(): int;

    /**
     * @param array<int, int> $centerIds
     */
    public function countByCenterIds(array $centerIds): int;

    public function codeExists(string $code): bool;

    public function nextId(): int;

    /**
     * @param int             $year
     * @param int             $month
     * @param array<int, int> $centerIds
     */
    public function countInYearMonthAndCenterIds(int $year, int $month, array $centerIds = []): int;

    /**
     * @param  ?array<int>                                                        $allowedCenterIds
     * @param  array<string>                                                      $columns
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\Student>
     */
    public function getActiveStudents(?array $allowedCenterIds = null, array $columns = ['id', 'full_name', 'student_code', 'phone', 'center_id']): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  int                                                                                                                                                                       $studentId
     * @param  ?string                                                                                                                                                                   $startDate
     * @param  ?string                                                                                                                                                                   $endDate
     * @param  ?int                                                                                                                                                                      $perPage
     * @param  int                                                                                                                                                                       $page
     * @return array{sessions: \Illuminate\Database\Eloquent\Collection<int, \App\Models\ClassSession>|\Illuminate\Contracts\Pagination\LengthAwarePaginator, stats: array<string, int>}
     */
    public function getStudentAttendanceStats(
        int $studentId,
        ?string $startDate = null,
        ?string $endDate = null,
        ?int $perPage = null,
        int $page = 1
    ): array;

    /**
     * @param Student              $student
     * @param array<int>           $classIds
     * @param array<string, mixed> $pivotDefaults
     */
    public function syncClasses(Student $student, array $classIds, array $pivotDefaults = []): void;

    /**
     * @param Student              $student
     * @param array<int>           $classIds
     * @param array<string, mixed> $pivotDefaults
     */
    public function attachClasses(Student $student, array $classIds, array $pivotDefaults = []): void;

    /**
     * @param Student $student
     * @param int     $classId
     */
    public function detachClass(Student $student, int $classId): bool;

    /**
     * @param  int                                                                     $studentId
     * @param  string                                                                  $startDate
     * @param  string                                                                  $endDate
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\ClassSession>
     */
    public function getStudentSessionsBetweenDates(int $studentId, string $startDate, string $endDate): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  int                            $studentId
     * @return \Illuminate\Support\Collection
     */
    public function getStudentWeeklySchedules(int $studentId): \Illuminate\Support\Collection;

    /**
     * Đếm số học sinh đang hoạt động (status = 1) của trung tâm.
     *
     * @param  int  $centerId
     * @param  ?int $excludeId
     * @return int
     */
    public function countActiveByCenterId(int $centerId, ?int $excludeId = null): int;

    /**
     * Đếm số học sinh đang hoạt động (status = 1) và tạm nghỉ (status = 2) của trung tâm.
     *
     * @param  int  $centerId
     * @param  ?int $excludeId
     * @return int
     */
    public function countActiveAndInactiveByCenterId(int $centerId, ?int $excludeId = null): int;

    /**
     * Lọc danh sách ID lớp học hợp lệ thuộc trung tâm.
     *
     * @param  int        $centerId
     * @param  array<int> $classIds
     * @return array<int>
     */
    public function filterValidClassIds(int $centerId, array $classIds): array;
}

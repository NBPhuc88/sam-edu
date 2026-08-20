<?php

namespace App\Repositories\Class;

use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SchoolClassRepositoryInterface
{
    /**
     * @param  ?string              $search
     * @param  array<int>|int|null  $centerIds
     * @param  ?string              $status
     * @param  int                  $perPage
     * @param  int                  $page
     * @return LengthAwarePaginator
     */
    public function paginate(
        ?string $search = null,
        array|int|null $centerIds = null,
        ?string $status = null,
        int $perPage = 15,
        int $page = 1
    ): LengthAwarePaginator;

    /**
     * @param  int              $id
     * @param  array<int>|null  $allowedCenterIds
     * @return SchoolClass|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?SchoolClass;

    public function findById(int $classId): ?SchoolClass;

    /**
     * @param  array<string, mixed> $data
     * @return SchoolClass
     */
    public function create(array $data): SchoolClass;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return SchoolClass
     */
    public function update(int $id, array $data): SchoolClass;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    /**
     * @param  SchoolClass                                         $schoolClass
     * @param  array<int, array{subject_id: int, teacher_id: int}> $subjectsWithTeachers
     * @return void
     */
    public function syncClassSubjects(SchoolClass $schoolClass, array $subjectsWithTeachers): void;

    /**
     * @param  int                      $classId
     * @return \Generator<int, Student>
     */
    public function getClassStudentsCursor(int $classId): \Generator;

    public function attachStudent(int $classId, int $studentId, ?string $note = null): bool;

    public function getPaginatedClassStudents(SchoolClass $schoolClass, ?string $search = null, int $perPage = 15, int $page = 1): LengthAwarePaginator;

    public function count(): int;

    /**
     * @param array<int, int> $centerIds
     */
    public function countByCenterIds(array $centerIds): int;

    public function codeExists(int $centerId, string $code): bool;

    /**
     * @param int             $year
     * @param int             $month
     * @param array<int, int> $centerIds
     */
    public function countInYearMonthAndCenterIds(int $year, int $month, array $centerIds = []): int;

    /**
     * @param  array<int, int>                                            $centerIds
     * @param  array<int, int>|null                                       $classIds
     * @return \Illuminate\Database\Eloquent\Collection<int, SchoolClass>
     */
    public function getClassesWithStudentCount(array $centerIds, ?array $classIds = null): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  array<int>|int|null                                        $centerIds
     * @param  array<string>                                              $columns
     * @return \Illuminate\Database\Eloquent\Collection<int, SchoolClass>
     */
    public function getClassesByCenterIds(array|int|null $centerIds = null, array $columns = ['id', 'name', 'code', 'center_id']): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  int                                                                     $classId
     * @param  string                                                                  $startDate (Y-m-d)
     * @param  string                                                                  $endDate   (Y-m-d)
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\ClassSession>
     */
    public function getClassSessionsBetweenDates(int $classId, string $startDate, string $endDate): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  int                                                                      $classId
     * @return \Illuminate\Database\Eloquent\Collection<int, \App\Models\ClassSchedule>
     */
    public function getClassWeeklySchedules(int $classId): \Illuminate\Database\Eloquent\Collection;

    /**
     * @param  int         $classId
     * @return SchoolClass
     */
    public function findWithCenter(int $classId): SchoolClass;

    /**
     * @param  ?array<int>                                                $allowedCenterIds
     * @return \Illuminate\Database\Eloquent\Collection<int, SchoolClass>
     */
    public function getClassesForScheduleForm(?array $allowedCenterIds = null): \Illuminate\Database\Eloquent\Collection;
}

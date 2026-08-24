<?php

namespace App\Repositories\Subject;

use App\Enums\Constant;
use App\Models\Subject;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SubjectRepositoryInterface
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
        int $perPage = Constant::DEFAULT_PER_PAGE,
        int $page = Constant::DEFAULT_PAGE
    ): LengthAwarePaginator;

    /**
     * @param  int             $id
     * @param  array<int>|null $allowedCenterIds
     * @return Subject|null
     */
    public function find(int $id, ?array $allowedCenterIds = null): ?Subject;

    /**
     * @param  array<string, mixed> $data
     * @return Subject
     */
    public function create(array $data): Subject;

    /**
     * @param  int                  $id
     * @param  array<string, mixed> $data
     * @return Subject
     */
    public function update(int $id, array $data): Subject;

    /**
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool;

    public function codeExists(int $centerId, string $code): bool;

    /**
     * @param  ?array<int, int>                                       $centerIds
     * @return \Illuminate\Database\Eloquent\Collection<int, Subject>
     */
    public function getByCenterIds(?array $centerIds = null): \Illuminate\Database\Eloquent\Collection;

    /**
     * Lấy danh sách môn học mà giáo viên được phân công giảng dạy tại trung tâm.
     *
     * @param  int                                                    $teacherId
     * @param  int                                                    $centerId
     * @return \Illuminate\Database\Eloquent\Collection<int, Subject>
     */
    public function getTaughtSubjectsByTeacher(int $teacherId, int $centerId): \Illuminate\Database\Eloquent\Collection;
}

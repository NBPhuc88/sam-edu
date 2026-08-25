<?php

namespace App\Services\ClassExam;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\ClassExam;
use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ClassExamServiceInterface
{
    /**
     * @return LengthAwarePaginator<ClassExam>
     * @param  ?string                         $search
     * @param  ?int                            $centerId
     * @param  ?int                            $classId
     * @param  ?int                            $examId
     * @param  ?string                         $status
     * @param  int                             $perPage
     * @param  int                             $page
     * @param  ?Admin                          $admin
     * @param  ?Teacher                        $teacher
     */
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
    ): LengthAwarePaginator;

    public function findClassExam(int $id, ?Admin $admin = null, ?Teacher $teacher = null): ClassExam;

    /**
     * @param array<string, mixed> $data
     * @param ?Admin               $admin
     * @param ?Teacher             $teacher
     */
    public function createClassExam(array $data, ?Admin $admin = null, ?Teacher $teacher = null): ClassExam;

    /**
     * @param array<string, mixed> $data
     * @param int                  $id
     * @param ?Admin               $admin
     * @param ?Teacher             $teacher
     */
    public function updateClassExam(int $id, array $data, ?Admin $admin = null, ?Teacher $teacher = null): ClassExam;

    public function deleteClassExam(int $id, ?Admin $admin = null, ?Teacher $teacher = null): bool;

    /**
     * @return array{centers: \Illuminate\Database\Eloquent\Collection<int, \App\Models\Center>, classes: \Illuminate\Database\Eloquent\Collection<int, \App\Models\SchoolClass>, exams: \Illuminate\Database\Eloquent\Collection<int, \App\Models\Exam>}
     * @param  ?Admin                                                                                                                                                                                                                                     $admin
     * @param  ?Teacher                                                                                                                                                                                                                                   $teacher
     */
    public function getFormData(?Admin $admin = null, ?Teacher $teacher = null): array;

    /**
     * @return array{total: int, scheduled: int, ongoing: int, completed: int}
     * @param  ?Admin                                                          $admin
     * @param  ?Teacher                                                        $teacher
     */
    public function getStats(?Admin $admin = null, ?Teacher $teacher = null): array;

    /**
     * Tự động quét và cập nhật trạng thái các kỳ thi lớp theo thời gian thực.
     *
     * @return array{ongoing: int, completed: int}
     */
    public function autoUpdateClassExamStatuses(): array;
}

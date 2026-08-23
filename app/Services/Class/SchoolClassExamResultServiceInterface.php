<?php

namespace App\Services\Class;

use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use Symfony\Component\HttpFoundation\StreamedResponse;

interface SchoolClassExamResultServiceInterface
{
    /**
     * @param  int                  $classId
     * @param  ?string              $search
     * @param  ?int                 $classExamId
     * @param  ?Admin               $admin
     * @param  ?Teacher             $teacher
     * @param  ?Student             $student
     * @return array<string, mixed>
     */
    public function getClassExamResultsData(
        int $classId,
        ?string $search = null,
        ?int $classExamId = null,
        ?Admin $admin = null,
        ?Teacher $teacher = null,
        ?Student $student = null
    ): array;

    /**
     * @param  int              $classId
     * @param  ?int             $classExamId
     * @param  ?Admin           $admin
     * @param  ?Teacher         $teacher
     * @return StreamedResponse
     */
    public function exportClassExamResultsCsv(
        int $classId,
        ?int $classExamId = null,
        ?Admin $admin = null,
        ?Teacher $teacher = null
    ): StreamedResponse;
}

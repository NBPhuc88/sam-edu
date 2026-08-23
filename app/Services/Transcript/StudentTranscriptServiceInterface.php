<?php

namespace App\Services\Transcript;

use App\Models\Student;

interface StudentTranscriptServiceInterface
{
    /**
     * Resolve student model by authenticated student or given ID.
     *
     * @param  ?int     $studentId
     * @return ?Student
     */
    public function resolveStudent(?int $studentId = null): ?Student;

    /**
     * Get transcript print data for a student and optional class.
     *
     * @param  Student              $student
     * @param  ?int                 $classId
     * @return array<string, mixed>
     */
    public function getTranscriptPrintData(Student $student, ?int $classId = null): array;
}

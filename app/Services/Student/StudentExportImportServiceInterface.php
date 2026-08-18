<?php

namespace App\Services\Student;

interface StudentExportImportServiceInterface
{
    /**
     * @return \Generator<int, array<int, string>>
     * @param  ?int                                $centerId
     * @param  ?int                                $classId
     */
    public function exportStudentsCsv(?int $centerId = null, ?int $classId = null): \Generator;

    /**
     * @return \Generator<int, array<string, string>>
     * @param  string                                 $filePath
     */
    public function readCsvStream(string $filePath): \Generator;

    /**
     * @return array{imported: int, updated: int, errors: array<int, string>}
     * @param  string                                                         $filePath
     * @param  ?int                                                           $centerId
     */
    public function importStudentsCsv(string $filePath, ?int $centerId = null): array;

    /**
     * @return array<int, array<int, string>>
     */
    public function getSampleCsvRows(): array;
}

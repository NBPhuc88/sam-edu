<?php

namespace App\Services\Student;

interface StudentExportImportServiceInterface
{
    /**
     * @return \Generator<int, array<int, string>>
     * @param  ?int                                $centerId
     * @param  ?int                                $classId
     * @param  bool                                $isSuperAdmin
     */
    public function exportStudentsCsv(?int $centerId = null, ?int $classId = null, bool $isSuperAdmin = false): \Generator;

    /**
     * @return \Generator<int, array<string, string>>
     * @param  string                                 $filePath
     */
    public function readCsvStream(string $filePath): \Generator;

    /**
     * @return array{imported: int, updated: int, errors: array<int, string>}
     * @param  string                                                         $filePath
     * @param  ?int                                                           $centerId
     * @param  bool                                                           $isSuperAdmin
     */
    public function importStudentsCsv(string $filePath, ?int $centerId = null, bool $isSuperAdmin = false): array;

    /**
     * @return array<int, array<int, string>>
     * @param  bool                           $isSuperAdmin
     */
    public function getSampleCsvRows(bool $isSuperAdmin = false): array;
}

<?php

namespace App\Services\Teacher;

interface TeacherExportImportServiceInterface
{
    /**
     * @return \Generator<int, array<int, string>>
     * @param  ?int                                $centerId
     */
    public function exportTeachersCsv(?int $centerId = null): \Generator;

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
    public function importTeachersCsv(string $filePath, ?int $centerId = null): array;

    /**
     * @return array<int, array<int, string>>
     */
    public function getSampleCsvRows(): array;
}

<?php

namespace App\Services\Teacher;

interface TeacherExportImportServiceInterface
{
    /**
     * @return \Generator<int, array<int, string>>
     */
    public function exportTeachersCsv(?int $centerId = null): \Generator;

    /**
     * @return \Generator<int, array<string, string>>
     */
    public function readCsvStream(string $filePath): \Generator;

    /**
     * @return array{imported: int, updated: int, errors: array<int, string>}
     */
    public function importTeachersCsv(string $filePath, ?int $centerId = null): array;

    /**
     * @return array<int, array<int, string>>
     */
    public function getSampleCsvRows(): array;
}

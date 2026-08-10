<?php

namespace App\Services\Student;

interface StudentExportImportServiceInterface
{
    /**
     * @return \Generator<int, array<int, string>>
     */
    public function exportStudentsCsv(?int $centerId = null): \Generator;

    /**
     * @return \Generator<int, array<string, string>>
     */
    public function readCsvStream(string $filePath): \Generator;

    /**
     * @return array{imported: int, updated: int, errors: array<int, string>}
     */
    public function importStudentsCsv(string $filePath, ?int $centerId = null): array;

    /**
     * @return array<int, array<int, string>>
     */
    public function getSampleCsvRows(): array;
}

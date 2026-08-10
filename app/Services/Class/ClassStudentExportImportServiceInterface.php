<?php

namespace App\Services\Class;

interface ClassStudentExportImportServiceInterface
{
    /**
     * @return \Generator<int, array<int, string>>
     */
    public function exportClassStudentsCsv(int $classId): \Generator;

    /**
     * @return \Generator<int, array<string, string>>
     */
    public function readCsvStream(string $filePath): \Generator;

    /**
     * @return array{imported: int, errors: array<int, string>}
     */
    public function importClassStudentsCsv(int $classId, string $filePath): array;

    /**
     * @return array<int, array<int, string>>
     */
    public function getSampleCsvRows(): array;
}

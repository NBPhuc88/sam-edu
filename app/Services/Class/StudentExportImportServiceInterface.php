<?php

namespace App\Services\Class;

interface StudentExportImportServiceInterface
{
    /**
     * @param  int                                 $classId
     * @return \Generator<int, array<int, string>>
     */
    public function exportClassStudentsCsv(int $classId): \Generator;

    /**
     * @param  string                                 $filePath
     * @return \Generator<int, array<string, string>>
     */
    public function readCsvStream(string $filePath): \Generator;

    /**
     * @param  int                                              $classId
     * @param  string                                           $filePath
     * @return array{imported: int, errors: array<int, string>}
     */
    public function importClassStudentsCsv(int $classId, string $filePath): array;

    /**
     * @return array<int, array<int, string>>
     */
    public function getSampleCsvRows(): array;
}

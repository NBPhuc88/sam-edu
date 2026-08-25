<?php

use Illuminate\Support\Facades\File;

test('logs:clean-old command deletes log files older than specified days and removes empty directories', function () {
    $testDir = storage_path('logs/test_cleanup/2026-06');

    if (! File::isDirectory($testDir)) {
        File::makeDirectory($testDir, 0755, true);
    }

    $oldLogFile = "{$testDir}/15.log";
    File::put($oldLogFile, 'Old log line from past month');

    // Create a current month log file
    $currentDir = storage_path('logs/test_cleanup/' . date('Y-m'));

    if (! File::isDirectory($currentDir)) {
        File::makeDirectory($currentDir, 0755, true);
    }
    $currentLogFile = "{$currentDir}/" . (int) date('j') . '.log';
    File::put($currentLogFile, 'Current log line');

    expect(File::exists($oldLogFile))->toBeTrue();
    expect(File::exists($currentLogFile))->toBeTrue();

    // Run clean command with default 30 days
    $this->artisan('logs:clean-old', ['--days' => 30])
        ->assertSuccessful();

    // Old file and its empty directory should be deleted
    expect(File::exists($oldLogFile))->toBeFalse();
    expect(File::isDirectory($testDir))->toBeFalse();

    // Current file should be preserved
    expect(File::exists($currentLogFile))->toBeTrue();

    // Cleanup test files
    File::deleteDirectory(storage_path('logs/test_cleanup'));
});

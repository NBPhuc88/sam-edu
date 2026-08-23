<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class MigrateMediaStorageCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sam:migrate-media-storage {--dry-run : Only show what would be migrated without changing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate uploaded media files to /home/phuc/sam and update database records to use /sam-storage/';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $this->info($dryRun ? 'Running in DRY-RUN mode...' : 'Starting media migration...');

        $samRoot = config('filesystems.disks.sam.root', '/home/phuc/sam');

        if (! is_dir($samRoot)) {
            @mkdir($samRoot, 0777, true);
        }

        // 1. Copy files from storage/app/public to /home/phuc/sam
        $publicDisk     = Storage::disk('public');
        $allPublicFiles = $publicDisk->allFiles();

        $this->info('Found ' . count($allPublicFiles) . ' files in public storage.');

        $copiedCount = 0;

        foreach ($allPublicFiles as $file) {
            $sourceFullPath = $publicDisk->path($file);
            $targetFullPath = rtrim($samRoot, '/') . '/' . ltrim($file, '/');

            $targetDir = dirname($targetFullPath);

            if (! is_dir($targetDir)) {
                if (! $dryRun) {
                    @mkdir($targetDir, 0777, true);
                }
            }

            if (! $dryRun) {
                File::copy($sourceFullPath, $targetFullPath);
            }
            $copiedCount++;
        }

        $this->info("Copied {$copiedCount} files to {$samRoot}.");

        // 2. Update Database tables: replace '/storage/' with '/sam-storage/' in relevant columns
        if (! $dryRun) {
            $this->info('Updating database records...');

            // exam_questions: image_url, audio_url, options, metadata
            if (DB::getSchemaBuilder()->hasTable('exam_questions')) {
                DB::statement("
                    UPDATE exam_questions 
                    SET image_url = REPLACE(image_url, '/storage/', '/sam-storage/')
                    WHERE image_url LIKE '%/storage/%'
                ");

                DB::statement("
                    UPDATE exam_questions 
                    SET audio_url = REPLACE(audio_url, '/storage/', '/sam-storage/')
                    WHERE audio_url LIKE '%/storage/%'
                ");

                DB::statement("
                    UPDATE exam_questions 
                    SET options = REPLACE(CAST(options AS CHAR), '/storage/', '/sam-storage/')
                    WHERE CAST(options AS CHAR) LIKE '%/storage/%'
                ");

                DB::statement("
                    UPDATE exam_questions 
                    SET metadata = REPLACE(CAST(metadata AS CHAR), '/storage/', '/sam-storage/')
                    WHERE CAST(metadata AS CHAR) LIKE '%/storage/%'
                ");
            }

            // student_documents
            if (DB::getSchemaBuilder()->hasTable('student_documents')) {
                if (DB::getSchemaBuilder()->hasColumn('student_documents', 'file_path')) {
                    DB::statement("
                        UPDATE student_documents 
                        SET file_path = REPLACE(file_path, '/storage/', '/sam-storage/')
                        WHERE file_path LIKE '%/storage/%'
                    ");
                }
            }

            // teachers
            if (DB::getSchemaBuilder()->hasTable('teachers')) {
                DB::statement("
                    UPDATE teachers 
                    SET avatar = REPLACE(avatar, '/storage/', '/sam-storage/')
                    WHERE avatar LIKE '%/storage/%'
                ");
            }

            // students
            if (DB::getSchemaBuilder()->hasTable('students')) {
                DB::statement("
                    UPDATE students 
                    SET avatar = REPLACE(avatar, '/storage/', '/sam-storage/')
                    WHERE avatar LIKE '%/storage/%'
                ");
            }

            // admins
            if (DB::getSchemaBuilder()->hasTable('admins')) {
                DB::statement("
                    UPDATE admins 
                    SET avatar = REPLACE(avatar, '/storage/', '/sam-storage/')
                    WHERE avatar LIKE '%/storage/%'
                ");
            }

            $this->info('Database records updated successfully.');
        }

        $this->info('Media migration completed successfully!');

        return Command::SUCCESS;
    }
}

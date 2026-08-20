<?php

namespace App\Jobs;

use App\Repositories\Session\ClassSessionRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateClassSessionsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param int                              $classSubjectId
     * @param array<int, array<string, mixed>> $sessionsPayload
     * @param bool                             $isUpdate
     * @param ?string                          $fromDate
     */
    public function __construct(
        public int $classSubjectId,
        public array $sessionsPayload,
        public bool $isUpdate = false,
        public ?string $fromDate = null
    ) {
    }

    /**
     * Execute the job.
     * @param ClassSessionRepositoryInterface $sessionRepository
     */
    public function handle(ClassSessionRepositoryInterface $sessionRepository): void
    {
        if ($this->isUpdate) {
            $sessionRepository->syncSessions(
                $this->classSubjectId,
                $this->sessionsPayload,
                $this->fromDate ?? now()->toDateString()
            );
        } else {
            $sessionRepository->bulkInsertSessions($this->sessionsPayload);
        }
    }
}

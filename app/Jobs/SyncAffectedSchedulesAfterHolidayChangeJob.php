<?php

namespace App\Jobs;

use App\Models\ClassSchedule;
use App\Models\Holiday;
use App\Repositories\Holiday\HolidayRepositoryInterface;
use App\Services\Schedule\ClassScheduleServiceInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncAffectedSchedulesAfterHolidayChangeJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param string      $action     'created' | 'updated' | 'deleted' | 'seeded'
     * @param string|null $targetDate Target holiday date (Y-m-d)
     * @param string|null $oldDate    Old holiday date if date changed
     * @param int|null    $year       Year if seeded
     */
    public function __construct(
        public string $action,
        public ?string $targetDate = null,
        public ?string $oldDate = null,
        public ?int $year = null
    ) {
    }

    /**
     * Execute the job.
     * @param ClassScheduleServiceInterface $scheduleService
     * @param HolidayRepositoryInterface    $holidayRepository
     */
    public function handle(
        ClassScheduleServiceInterface $scheduleService,
        HolidayRepositoryInterface $holidayRepository
    ): void {
        Log::channel('single')->info('[HolidaySync] Starting schedule sync job', [
            'action'      => $this->action,
            'target_date' => $this->targetDate,
            'old_date'    => $this->oldDate,
            'year'        => $this->year,
        ]);

        $today = now()->toDateString();

        // 1. Lấy tất cả lịch học đang hoạt động có ngày kết thúc chưa kết thúc hoặc trong tương lai
        $query = ClassSchedule::query()
            ->where('status', 'active')
            ->whereHas('classSubject', function ($q) use ($today) {
                $q->where(function ($subQ) use ($today) {
                    $subQ->whereNull('end_date')
                        ->orWhere('end_date', '>=', $today);
                });
            })
            ->with(['classSubject.schoolClass', 'classSubject.subject']);

        $schedules = $query->get();

        $affectedCount = 0;

        foreach ($schedules as $schedule) {
            $classSubject = $schedule->classSubject;

            if (! $classSubject) {
                continue;
            }

            $startDate = $classSubject->start_date?->format('Y-m-d') ?: $today;
            $endDate   = $classSubject->end_date?->format('Y-m-d');

            // Kiểm tra xem lịch này có bị ảnh hưởng bởi ngày lễ không
            $isAffected = false;

            if ($schedule->auto_holidays) {
                if ($this->targetDate) {
                    if ($this->targetDate >= $startDate && (! $endDate || $this->targetDate <= $endDate)) {
                        $isAffected = true;
                    }
                }

                if ($this->oldDate) {
                    if ($this->oldDate >= $startDate && (! $endDate || $this->oldDate <= $endDate)) {
                        $isAffected = true;
                    }
                }

                if ($this->year && $this->action === 'seeded') {
                    $startYear = (int) substr($startDate, 0, 4);
                    $endYear   = $endDate ? (int) substr($endDate, 0, 4) : $startYear + 1;

                    if ($this->year >= $startYear && $this->year <= $endYear) {
                        $isAffected = true;
                    }
                }
            } else {
                // Kiểm tra nếu ngày lễ nằm trong mảng holidays tùy chỉnh của lịch
                $existingHolidays = $schedule->holidays ?: [];

                foreach ($existingHolidays as $h) {
                    $hDate = is_array($h) ? ($h['date'] ?? null) : (string) $h;

                    if ($hDate === $this->targetDate || ($this->oldDate && $hDate === $this->oldDate)) {
                        $isAffected = true;

                        break;
                    }
                }
            }

            if ($isAffected) {
                // Cập nhật lại mảng holidays cho lịch nếu auto_holidays = true
                if ($schedule->auto_holidays) {
                    $maxScanEnd      = $endDate ?: now()->addYears(2)->toDateString();
                    $holidaysInRange = $holidayRepository->getInRange($startDate, $maxScanEnd);
                    $updatedHolidays = $holidaysInRange->map(fn ($h) => [
                        'id'   => $h->id,
                        'name' => $h->name,
                        'date' => $h->date instanceof \DateTimeInterface ? $h->date->format('Y-m-d') : (string) $h->date,
                    ])->toArray();

                    $schedule->update([
                        'holidays' => $updatedHolidays,
                    ]);
                }

                // Tái sinh các ca học tương lai qua service
                $scheduleService->regenerateFutureSessions($schedule);
                $affectedCount++;
            }
        }

        Log::channel('single')->info("[HolidaySync] Finished schedule sync job. Affected schedules: {$affectedCount}");
    }
}

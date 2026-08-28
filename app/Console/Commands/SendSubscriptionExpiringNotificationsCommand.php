<?php

namespace App\Console\Commands;

use App\Enums\Constant;
use App\Mail\CenterSubscriptionExpiringMail;
use App\Models\Center;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendSubscriptionExpiringNotificationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'centers:notify-expiring-subscription {--days=7 : Số ngày còn lại trước khi hết hạn}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gửi email thông báo tự động cho các Trung tâm có gói dịch vụ sắp hết hạn (mặc định 7 ngày).';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days       = (int) $this->option('days');
        $targetDate = now()->addDays($days);

        $centers = Center::query()
            ->where('status', Constant::CENTER_STATUS_ACTIVE)
            ->where(function ($query) use ($targetDate) {
                $query->whereBetween('expires_at', [
                    $targetDate->copy()->startOfDay(),
                    $targetDate->copy()->endOfDay(),
                ])->orWhere(function ($q) use ($targetDate) {
                    $q->whereNull('expires_at')
                        ->whereBetween('trial_ends_at', [
                            $targetDate->copy()->startOfDay(),
                            $targetDate->copy()->endOfDay(),
                        ]);
                });
            })
            ->with(['admins'])
            ->get();

        if ($centers->isEmpty()) {
            $this->info("Không có trung tâm nào hết hạn sau {$days} ngày tới ({$targetDate->format('d/m/Y')}).");

            return self::SUCCESS;
        }

        $count = 0;

        foreach ($centers as $center) {
            $recipientEmails = array_filter(array_unique(array_merge(
                [$center->email],
                $center->admins->pluck('email')->toArray()
            )));

            if (empty($recipientEmails)) {
                $this->warn("Trung tâm '{$center->name}' ({$center->code}) không có email để gửi.");

                continue;
            }

            foreach ($recipientEmails as $email) {
                Mail::to($email)->queue(new CenterSubscriptionExpiringMail($center, $days));
            }

            $count++;
            $this->info("Đã xếp hàng email thông báo hết hạn ({$days} ngày) cho trung tâm '{$center->name}' ({$center->code}) tới: " . implode(', ', $recipientEmails));
            Log::info("Sent subscription expiration notice email for center ID {$center->id} ({$center->code}) expiring on {$targetDate->format('Y-m-d')}");
        }

        $this->info("Hoàn tất gửi email cho {$count} trung tâm.");

        return self::SUCCESS;
    }
}

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

        // 1. Tự động chuyển các trung tâm đã hết hạn sang trạng thái CENTER_STATUS_EXPIRED (3) (chỉ tính sau 23h)
        $expiredCount = Center::query()
            ->where('status', Constant::CENTER_STATUS_ACTIVE)
            ->where(function ($q) {
                $q->whereRaw('DATE_ADD(DATE(expires_at), INTERVAL 23 HOUR) <= NOW()')
                    ->orWhere(function ($sub) {
                        $sub->whereNull('expires_at')
                            ->whereRaw('DATE_ADD(DATE(trial_ends_at), INTERVAL 23 HOUR) <= NOW()');
                    });
            })
            ->update(['status' => Constant::CENTER_STATUS_EXPIRED]);

        if ($expiredCount > 0) {
            $this->info("Đã tự động cập nhật trạng thái 'Đã hết hạn' cho {$expiredCount} trung tâm.");
            Log::info("Auto-updated {$expiredCount} expired centers to CENTER_STATUS_EXPIRED.");
        }

        // 2. Gửi email cảnh báo cho các trung tâm sắp hết hạn trong N ngày tới
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

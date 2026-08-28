<?php

namespace App\Console\Commands;

use App\Enums\Constant;
use App\Events\ClassChatMessageSent;
use App\Models\ClassChatMessage;
use App\Models\ClassExam;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class SendClassExamRoomCodeCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'class-exams:send-room-code';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kiểm tra các kỳ thi của lớp còn ít hơn 10 phút đến giờ bắt đầu và tự động gửi mã phòng thi vào chat của lớp.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Đang kiểm tra các kỳ thi sắp diễn ra trong 10 phút tới...');

        $now             = Carbon::now();
        $tenMinutesLater = $now->copy()->addMinutes(10);

        // Lấy tất cả kỳ thi ở trạng thái 'scheduled' hoặc 'ongoing'
        $classExams = ClassExam::whereIn('status', [
            Constant::CLASS_EXAM_STATUS_SCHEDULED,
            Constant::CLASS_EXAM_STATUS_ONGOING,
        ])->get();

        $sentCount = 0;

        foreach ($classExams as $exam) {
            if (empty($exam->class_id)) {
                continue;
            }

            // Xác định thời gian bắt đầu kỳ thi
            $startDateTime = null;

            if (! empty($exam->valid_from)) {
                $startDateTime = Carbon::parse($exam->valid_from);
            } elseif (! empty($exam->exam_date) && ! empty($exam->start_time)) {
                $dateStr = $exam->exam_date instanceof Carbon
                    ? $exam->exam_date->format('Y-m-d')
                    : Carbon::parse($exam->exam_date)->format('Y-m-d');
                $startDateTime = Carbon::parse("{$dateStr} {$exam->start_time}");
            }

            if (! $startDateTime) {
                continue;
            }

            // Kiểm tra kỳ thi còn ít hơn hoặc bằng 10 phút nữa là đến giờ bắt đầu (và chưa trôi qua quá 10 phút)
            $diffInMinutes = $now->diffInMinutes($startDateTime, false);

            if ($diffInMinutes < -5 || $diffInMinutes > 10) {
                continue;
            }

            $accessCode = $exam->access_code ?? $exam->code;

            if (empty($accessCode)) {
                continue;
            }

            // Kiểm tra xem đã gửi mã phòng thi cho kỳ thi này vào nhóm chat của lớp chưa
            $alreadySent = ClassChatMessage::where('class_id', $exam->class_id)
                ->where('message', 'like', "%{$accessCode}%")
                ->exists();

            if ($alreadySent) {
                continue;
            }

            $timeFormatted = $startDateTime->format('H:i, d/m/Y');
            $messageText   = "⏰ [THÔNG BÁO KỲ THI] Kỳ thi \"{$exam->title}\" sắp diễn ra (thời gian: {$timeFormatted}). Mã phòng thi của lớp là: {$accessCode}";

            $chatMessage = ClassChatMessage::create([
                'class_id'      => $exam->class_id,
                'reply_to_id'   => null,
                'sender_type'   => 'system',
                'sender_id'     => 0,
                'sender_name'   => 'Hệ thống',
                'sender_avatar' => null,
                'message'       => $messageText,
                'is_pinned'     => false,
            ]);

            $formattedMessage = [
                'id'             => $chatMessage->id,
                'class_id'       => $exam->class_id,
                'reply_to_id'    => null,
                'reply_to'       => null,
                'reactions'      => [],
                'sender_type'    => 'system',
                'sender_id'      => 0,
                'sender_name'    => 'Hệ thống',
                'sender_avatar'  => null,
                'message'        => $messageText,
                'is_pinned'      => false,
                'pinned_at'      => null,
                'pinned_by_name' => null,
                'created_at'     => $chatMessage->created_at ? $chatMessage->created_at->toIso8601String() : now()->toIso8601String(),
                'time_formatted' => $chatMessage->created_at ? $chatMessage->created_at->format('H:i, d/m') : date('H:i, d/m'),
            ];

            try {
                $redisKey = "chat:class:{$exam->class_id}:messages";
                Redis::rpush($redisKey, json_encode($formattedMessage));
            } catch (\Throwable $e) {
                // Redis error fallback
            }

            try {
                event(new ClassChatMessageSent($exam->class_id, $formattedMessage));
            } catch (\Throwable $e) {
                // Event broadcasting error fallback
            }

            $sentCount++;
            $this->info("✓ Đã gửi mã phòng thi ({$accessCode}) cho lớp ID {$exam->class_id} (Kỳ thi: {$exam->title})");
        }

        $this->info("Hoàn tất! Đã gửi thông báo cho {$sentCount} kỳ thi.");

        return self::SUCCESS;
    }
}

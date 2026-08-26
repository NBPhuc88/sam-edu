<?php

namespace App\Providers;

use App\Enums\Constant;
use App\Repositories\Admin\AdminRepository;
use App\Repositories\Admin\AdminRepositoryInterface;
use App\Repositories\Auth\PasswordResetRepository;
use App\Repositories\Auth\PasswordResetRepositoryInterface;
use App\Repositories\Center\CenterRepository;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Chat\ChatRepository;
use App\Repositories\Chat\ChatRepositoryInterface;
use App\Repositories\Class\SchoolClassRepository;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Home\ContactRequestRepository;
use App\Repositories\Home\ContactRequestRepositoryInterface;
use App\Repositories\Payment\PaymentTransactionRepository;
use App\Repositories\Payment\PaymentTransactionRepositoryInterface;
use App\Repositories\Student\StudentRepository;
use App\Repositories\Student\StudentRepositoryInterface;
use App\Repositories\Teacher\TeacherRepository;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use App\Services\Admin\AdminService;
use App\Services\Admin\AdminServiceInterface;
use App\Services\Auth\AuthService;
use App\Services\Auth\AuthServiceInterface;
use App\Services\Auth\PasswordResetService;
use App\Services\Auth\PasswordResetServiceInterface;
use App\Services\Center\CenterRegisterService;
use App\Services\Center\CenterRegisterServiceInterface;
use App\Services\Center\CenterService;
use App\Services\Center\CenterServiceInterface;
use App\Services\Chat\ChatService;
use App\Services\Chat\ChatServiceInterface;
use App\Services\Class\StudentExportImportService as ClassStudentExportImportService;
use App\Services\Class\StudentExportImportServiceInterface as ClassStudentExportImportServiceInterface;
use App\Services\Dashboard\DashboardService;
use App\Services\Dashboard\DashboardServiceInterface;
use App\Services\Home\ContactRequestService;
use App\Services\Home\ContactRequestServiceInterface;
use App\Services\Payment\PaymentGatewayInterface;
use App\Services\Payment\ZaloPayGateway;
use App\Services\Statistic\StatisticService;
use App\Services\Statistic\StatisticServiceInterface;
use App\Services\Student\StudentExportImportService;
use App\Services\Student\StudentExportImportServiceInterface;
use App\Services\Student\StudentService;
use App\Services\Student\StudentServiceInterface;
use App\Services\Teacher\TeacherExportImportService;
use App\Services\Teacher\TeacherExportImportServiceInterface;
use App\Services\Teacher\TeacherService;
use App\Services\Teacher\TeacherServiceInterface;
use App\Services\Zalo\ZaloService;
use App\Services\Zalo\ZaloServiceInterface;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PasswordResetServiceInterface::class, PasswordResetService::class);
        $this->app->bind(ZaloServiceInterface::class, ZaloService::class);
        $this->app->bind(PaymentGatewayInterface::class, ZaloPayGateway::class);
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(StudentExportImportServiceInterface::class, StudentExportImportService::class);
        $this->app->bind(ClassStudentExportImportServiceInterface::class, ClassStudentExportImportService::class);
        $this->app->bind(TeacherExportImportServiceInterface::class, TeacherExportImportService::class);
        $this->app->bind(ChatServiceInterface::class, ChatService::class);
        $this->app->bind(CenterServiceInterface::class, CenterService::class);
        $this->app->bind(CenterRegisterServiceInterface::class, CenterRegisterService::class);
        $this->app->bind(AdminServiceInterface::class, AdminService::class);
        $this->app->bind(StudentServiceInterface::class, StudentService::class);
        $this->app->bind(TeacherServiceInterface::class, TeacherService::class);
        $this->app->bind(\App\Services\Tuition\StudentTuitionServiceInterface::class, \App\Services\Tuition\StudentTuitionService::class);
        $this->app->bind(\App\Services\Subject\SubjectServiceInterface::class, \App\Services\Subject\SubjectService::class);
        $this->app->bind(\App\Services\Room\RoomServiceInterface::class, \App\Services\Room\RoomService::class);
        $this->app->bind(\App\Services\Class\SchoolClassServiceInterface::class, \App\Services\Class\SchoolClassService::class);
        $this->app->bind(\App\Services\Class\SchoolClassExamResultServiceInterface::class, \App\Services\Class\SchoolClassExamResultService::class);
        $this->app->bind(\App\Services\Schedule\ClassScheduleServiceInterface::class, \App\Services\Schedule\ClassScheduleService::class);
        $this->app->bind(ContactRequestServiceInterface::class, ContactRequestService::class);
        $this->app->bind(DashboardServiceInterface::class, DashboardService::class);
        $this->app->bind(StatisticServiceInterface::class, StatisticService::class);
        $this->app->bind(\App\Services\Home\HomeServiceInterface::class, \App\Services\Home\HomeService::class);
        $this->app->bind(\App\Services\Payment\PaymentServiceInterface::class, \App\Services\Payment\PaymentService::class);
        $this->app->bind(\App\Services\Attendance\AttendanceServiceInterface::class, \App\Services\Attendance\AttendanceService::class);
        $this->app->bind(\App\Services\Session\ClassSessionServiceInterface::class, \App\Services\Session\ClassSessionService::class);
        $this->app->bind(\App\Services\Subscription\SubscriptionPlanServiceInterface::class, \App\Services\Subscription\SubscriptionPlanService::class);
        $this->app->bind(\App\Services\Exam\ExamServiceInterface::class, \App\Services\Exam\ExamService::class);
        $this->app->bind(\App\Services\Exam\PracticeExamServiceInterface::class, \App\Services\Exam\PracticeExamService::class);
        $this->app->bind(\App\Services\ClassExam\ClassExamServiceInterface::class, \App\Services\ClassExam\ClassExamService::class);
        $this->app->bind(\App\Services\OnlineExam\OnlineExamServiceInterface::class, \App\Services\OnlineExam\OnlineExamService::class);
        $this->app->bind(\App\Services\Media\MediaUploadServiceInterface::class, \App\Services\Media\MediaUploadService::class);
        $this->app->bind(\App\Services\Holiday\HolidayServiceInterface::class, \App\Services\Holiday\HolidayService::class);
        $this->app->bind(\App\Services\Grading\GradingServiceInterface::class, \App\Services\Grading\GradingService::class);
        $this->app->bind(\App\Services\Permission\PermissionServiceInterface::class, \App\Services\Permission\PermissionService::class);
        $this->app->bind(\App\Services\Profile\ProfileServiceInterface::class, \App\Services\Profile\ProfileService::class);
        $this->app->bind(\App\Services\Impact\DeleteImpactServiceInterface::class, \App\Services\Impact\DeleteImpactService::class);
        $this->app->bind(\App\Services\Transcript\StudentTranscriptServiceInterface::class, \App\Services\Transcript\StudentTranscriptService::class);
        $this->app->bind(\App\Services\Setting\SettingServiceInterface::class, \App\Services\Setting\SettingService::class);

        // Repository Bindings
        $this->app->bind(PasswordResetRepositoryInterface::class, PasswordResetRepository::class);
        $this->app->bind(\App\Repositories\Profile\ProfileRepositoryInterface::class, \App\Repositories\Profile\ProfileRepository::class);
        $this->app->bind(AdminRepositoryInterface::class, AdminRepository::class);
        $this->app->bind(TeacherRepositoryInterface::class, TeacherRepository::class);
        $this->app->bind(StudentRepositoryInterface::class, StudentRepository::class);
        $this->app->bind(SchoolClassRepositoryInterface::class, SchoolClassRepository::class);
        $this->app->bind(\App\Repositories\Tuition\StudentTuitionRepositoryInterface::class, \App\Repositories\Tuition\StudentTuitionRepository::class);
        $this->app->bind(\App\Repositories\Tuition\TuitionPaymentRepositoryInterface::class, \App\Repositories\Tuition\TuitionPaymentRepository::class);
        $this->app->bind(\App\Repositories\Subject\SubjectRepositoryInterface::class, \App\Repositories\Subject\SubjectRepository::class);
        $this->app->bind(\App\Repositories\Room\RoomRepositoryInterface::class, \App\Repositories\Room\RoomRepository::class);
        $this->app->bind(\App\Repositories\Schedule\ClassScheduleRepositoryInterface::class, \App\Repositories\Schedule\ClassScheduleRepository::class);
        $this->app->bind(\App\Repositories\Session\ClassSessionRepositoryInterface::class, \App\Repositories\Session\ClassSessionRepository::class);
        $this->app->bind(\App\Repositories\Attendance\AttendanceRepositoryInterface::class, \App\Repositories\Attendance\AttendanceRepository::class);
        $this->app->bind(ChatRepositoryInterface::class, ChatRepository::class);
        $this->app->bind(CenterRepositoryInterface::class, CenterRepository::class);
        $this->app->bind(PaymentTransactionRepositoryInterface::class, PaymentTransactionRepository::class);
        $this->app->bind(ContactRequestRepositoryInterface::class, ContactRequestRepository::class);
        $this->app->bind(\App\Repositories\Setting\SystemSettingRepositoryInterface::class, \App\Repositories\Setting\SystemSettingRepository::class);
        $this->app->bind(\App\Repositories\Setting\SeoMetadataRepositoryInterface::class, \App\Repositories\Setting\SeoMetadataRepository::class);
        $this->app->bind(\App\Repositories\Subscription\SubscriptionPlanRepositoryInterface::class, \App\Repositories\Subscription\SubscriptionPlanRepository::class);
        $this->app->bind(\App\Repositories\Subscription\CenterSubscriptionRepositoryInterface::class, \App\Repositories\Subscription\CenterSubscriptionRepository::class);
        $this->app->bind(\App\Repositories\Exam\ExamResultRepositoryInterface::class, \App\Repositories\Exam\ExamResultRepository::class);
        $this->app->bind(\App\Repositories\Exam\ExamRepositoryInterface::class, \App\Repositories\Exam\ExamRepository::class);
        $this->app->bind(\App\Repositories\ClassExam\ClassExamRepositoryInterface::class, \App\Repositories\ClassExam\ClassExamRepository::class);
        $this->app->bind(\App\Repositories\Holiday\HolidayRepositoryInterface::class, \App\Repositories\Holiday\HolidayRepository::class);
        $this->app->bind(\App\Repositories\Grading\GradingRepositoryInterface::class, \App\Repositories\Grading\GradingRepository::class);
        $this->app->bind(\App\Repositories\Permission\PermissionRepositoryInterface::class, \App\Repositories\Permission\PermissionRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configurePagination();
        $this->configureQueueAndMailLogging();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Cấu hình tối ưu phân trang Deferred Join (Late Lookup / Join trì hoãn).
     */
    protected function configurePagination(): void
    {
        Builder::macro('deferredPaginate', function (
            int $perPage = Constant::DEFAULT_PER_PAGE,
            array $columns = ['*'],
            string $pageName = 'page',
            ?int $page = null
        ): LengthAwarePaginator {
            /** @var Builder $this */
            $model   = $this->getModel();
            $keyName = $model->getQualifiedKeyName();

            $page = $page ?: Paginator::resolveCurrentPage($pageName);

            // 1. Tính tổng số dòng (Count query)
            $total = $this->toBase()->getCountForPagination();

            if ($total === 0) {
                return new LengthAwarePaginator(
                    $model->newCollection(),
                    0,
                    $perPage,
                    $page,
                    [
                        'path'     => Paginator::resolveCurrentPath(),
                        'pageName' => $pageName,
                    ]
                );
            }

            // 2. Subquery / Index-only scan: Lấy danh sách ID của trang hiện tại (Lightweight offset)
            $idQuery = (clone $this)
                ->setEagerLoads([])
                ->select([$keyName]);

            $ids = $idQuery
                ->forPage($page, $perPage)
                ->pluck($model->getKeyName());

            if ($ids->isEmpty()) {
                $items = $model->newCollection();
            } else {
                // 3. Deferred Join: Lấy dữ liệu và eager load quan hệ cho đúng các ID đã lấy
                $items = $this->clone()
                    ->setQuery($model->newQueryWithoutScopes()->getQuery())
                    ->whereIn($keyName, $ids)
                    ->get($columns);

                // Bảo toàn thứ tự ban đầu của $ids
                $orderMap = array_flip($ids->toArray());
                $items    = $items->sortBy(fn ($item) => $orderMap[$item->getKey()] ?? PHP_INT_MAX)->values();
            }

            return new LengthAwarePaginator(
                $items,
                $total,
                $perPage,
                $page,
                [
                    'path'     => Paginator::resolveCurrentPath(),
                    'pageName' => $pageName,
                ]
            );
        });
    }

    /**
     * Cấu hình ghi log chi tiết cho Queue Worker và Mail Job theo storage/logs/queue/YYYY-MM/D.log
     */
    protected function configureQueueAndMailLogging(): void
    {
        Queue::before(function (JobProcessing $event) {
            $jobName = $event->job->resolveName();
            $jobId   = $event->job->getJobId();
            $queue   = $event->job->getQueue();

            Log::channel('queue')->info("[Queue Job Started] {$jobName} (ID: {$jobId}) on queue '{$queue}'");
        });

        Queue::after(function (JobProcessed $event) {
            $jobName = $event->job->resolveName();
            $jobId   = $event->job->getJobId();

            Log::channel('queue')->info("[Queue Job Completed] {$jobName} (ID: {$jobId}) finished successfully");
        });

        Queue::failing(function (JobFailed $event) {
            $jobName  = $event->job->resolveName();
            $jobId    = $event->job->getJobId();
            $errorMsg = $event->exception->getMessage();

            Log::channel('queue')->error("[Queue Job Failed] {$jobName} (ID: {$jobId}): {$errorMsg}", [
                'exception' => $event->exception->getTraceAsString(),
            ]);
        });

        Event::listen(MessageSending::class, function (MessageSending $event) {
            $subject = $event->message->getSubject() ?? '(No Subject)';
            $to      = $event->message->getTo();
            $toList  = ! empty($to) ? implode(', ', array_map(fn ($addr) => $addr->toString(), $to)) : 'unknown';

            Log::channel('queue')->info("[Mail Sending] Subject: '{$subject}' | To: [{$toList}]");
        });

        Event::listen(MessageSent::class, function (MessageSent $event) {
            $subject = $event->message->getSubject() ?? '(No Subject)';
            $to      = $event->message->getTo();
            $toList  = ! empty($to) ? implode(', ', array_map(fn ($addr) => $addr->toString(), $to)) : 'unknown';

            Log::channel('queue')->info("[Mail Sent Successfully] Subject: '{$subject}' | To: [{$toList}]");
        });
    }
}

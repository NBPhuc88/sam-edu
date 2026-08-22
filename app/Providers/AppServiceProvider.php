<?php

namespace App\Providers;

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
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
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

        // Repository Bindings
        $this->app->bind(PasswordResetRepositoryInterface::class, PasswordResetRepository::class);
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
        $this->app->bind(\App\Repositories\Subscription\SubscriptionPlanRepositoryInterface::class, \App\Repositories\Subscription\SubscriptionPlanRepository::class);
        $this->app->bind(\App\Repositories\Subscription\CenterSubscriptionRepositoryInterface::class, \App\Repositories\Subscription\CenterSubscriptionRepository::class);
        $this->app->bind(\App\Repositories\Exam\ExamResultRepositoryInterface::class, \App\Repositories\Exam\ExamResultRepository::class);
        $this->app->bind(\App\Repositories\Exam\ExamRepositoryInterface::class, \App\Repositories\Exam\ExamRepository::class);
        $this->app->bind(\App\Repositories\ClassExam\ClassExamRepositoryInterface::class, \App\Repositories\ClassExam\ClassExamRepository::class);
        $this->app->bind(\App\Repositories\Holiday\HolidayRepositoryInterface::class, \App\Repositories\Holiday\HolidayRepository::class);
        $this->app->bind(\App\Repositories\Grading\GradingRepositoryInterface::class, \App\Repositories\Grading\GradingRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
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
}

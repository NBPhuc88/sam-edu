<?php

namespace App\Providers;

use App\Repositories\Admin\AdminRepository;
use App\Repositories\Admin\AdminRepositoryInterface;
use App\Repositories\Chat\ClassChatRepository;
use App\Repositories\Chat\ClassChatRepositoryInterface;
use App\Repositories\Class\SchoolClassRepository;
use App\Repositories\Class\SchoolClassRepositoryInterface;
use App\Repositories\Student\StudentRepository;
use App\Repositories\Student\StudentRepositoryInterface;
use App\Repositories\Teacher\TeacherRepository;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use App\Services\Auth\AuthService;
use App\Services\Auth\AuthServiceInterface;
use App\Services\Chat\ClassChatService;
use App\Services\Chat\ClassChatServiceInterface;
use App\Services\Class\ClassStudentExportImportService;
use App\Services\Class\ClassStudentExportImportServiceInterface;
use App\Services\Student\StudentExportImportService;
use App\Services\Student\StudentExportImportServiceInterface;
use App\Services\Teacher\TeacherExportImportService;
use App\Services\Teacher\TeacherExportImportServiceInterface;
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
        // Service Bindings
        $this->app->bind(ZaloServiceInterface::class, ZaloService::class);
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
        $this->app->bind(
            StudentExportImportServiceInterface::class,
            StudentExportImportService::class
        );
        $this->app->bind(
            ClassStudentExportImportServiceInterface::class,
            ClassStudentExportImportService::class
        );
        $this->app->bind(
            TeacherExportImportServiceInterface::class,
            TeacherExportImportService::class
        );
        $this->app->bind(
            ClassChatServiceInterface::class,
            ClassChatService::class
        );

        // Repository Bindings
        $this->app->bind(AdminRepositoryInterface::class, AdminRepository::class);
        $this->app->bind(TeacherRepositoryInterface::class, TeacherRepository::class);
        $this->app->bind(StudentRepositoryInterface::class, StudentRepository::class);
        $this->app->bind(
            SchoolClassRepositoryInterface::class,
            SchoolClassRepository::class
        );
        $this->app->bind(
            ClassChatRepositoryInterface::class,
            ClassChatRepository::class
        );
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

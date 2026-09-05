<?php

namespace Database\Seeders;

use App\Enums\Constant;
use App\Models\Permission;
use App\Models\RolePermission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * @param int|string|null $targetRole
     */
    public function run(int|string|null $targetRole = null): void
    {
        // 1. Đồng bộ permissions từ config
        Artisan::call('permission:sync');

        $allPermissions = Permission::all();

        // 2. Định nghĩa danh sách quyền mặc định cho từng vai trò theo số nguyên Constant
        $roleDefaults = [
            Constant::ROLE_SUPER_ADMIN => $allPermissions->pluck('code')->toArray(),

            Constant::ROLE_ADMIN => [
                'dashboard.index', 'statistics.index',
                'teachers.index', 'teachers.show', 'teachers.create', 'teachers.edit', 'teachers.delete', 'teachers.export', 'teachers.export-sessions', 'teachers.import', 'teachers.schedule',
                'students.index', 'students.show', 'students.create', 'students.edit', 'students.delete', 'students.assign-classes', 'students.export', 'students.export-attendances', 'students.import', 'students.schedule',
                'subjects.index', 'subjects.create', 'subjects.edit', 'subjects.delete',
                'rooms.index', 'rooms.create', 'rooms.edit', 'rooms.delete',
                'classes.index', 'classes.create', 'classes.edit', 'classes.delete', 'classes.schedule', 'classes.students', 'classes.exam-results', 'classes.chat',
                'schedules.index', 'schedules.create', 'schedules.edit', 'schedules.delete',
                'sessions.index', 'sessions.edit', 'attendance.index', 'attendance.save',
                'exams.index', 'exams.create', 'exams.edit', 'exams.delete',
                'game-rooms.index', 'game-rooms.create',
                'class-exams.index', 'class-exams.create', 'class-exams.edit', 'class-exams.delete',
                'grading.index', 'grading.create', 'grading.grade',
                'online-exam.enter', 'practice-exams.index',
                'tuitions.index', 'tuitions.create', 'tuitions.edit', 'tuitions.delete', 'tuitions.export', 'tuitions.payments',
                'notifications.index',
            ],

            Constant::ROLE_TEACHER => [
                'dashboard.index',
                'teachers.schedule',
                'students.index', 'students.show', 'students.schedule',
                'classes.index', 'classes.schedule', 'classes.exam-results', 'classes.chat',
                'schedules.index',
                'sessions.index', 'attendance.index', 'attendance.save',
                'exams.index', 'exams.create', 'exams.edit', 'exams.delete',
                'game-rooms.index', 'game-rooms.create',
                'class-exams.index', 'class-exams.create', 'class-exams.edit', 'class-exams.delete',
                'grading.index', 'grading.create', 'grading.grade',
                'online-exam.enter', 'practice-exams.index',
                'notifications.index',
            ],

            Constant::ROLE_STUDENT => [
                'dashboard.index',
                'classes.index', 'classes.schedule', 'classes.exam-results', 'classes.chat',
                'schedules.index',
                'game-rooms.index',
                'tuitions.index',
                'online-exam.enter', 'practice-exams.index',
                'notifications.index',
            ],
        ];

        $normalizedTargetRole = null;

        if ($targetRole !== null) {
            $normalizedTargetRole = is_numeric($targetRole) ? (int) $targetRole : match ($targetRole) {
                'super_admin' => Constant::ROLE_SUPER_ADMIN,
                'teacher'     => Constant::ROLE_TEACHER,
                'student'     => Constant::ROLE_STUDENT,
                default       => Constant::ROLE_ADMIN,
            };
        }

        $rolesToSeed = ($normalizedTargetRole !== null && isset($roleDefaults[$normalizedTargetRole]))
            ? [$normalizedTargetRole => $roleDefaults[$normalizedTargetRole]]
            : $roleDefaults;

        foreach ($rolesToSeed as $numericRole => $codes) {
            $permissionIds = $allPermissions->whereIn('code', $codes)->pluck('id');

            // Xóa quyền cũ của role và gán lại quyền chuẩn
            RolePermission::where('role', (int) $numericRole)->delete();

            $records = [];
            $now     = now();

            foreach ($permissionIds as $permId) {
                $records[] = [
                    'role'          => (int) $numericRole,
                    'permission_id' => $permId,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];
            }

            if (! empty($records)) {
                RolePermission::insert($records);
            }
        }
    }
}

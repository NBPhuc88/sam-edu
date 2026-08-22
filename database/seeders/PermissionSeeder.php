<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\RolePermission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * @param ?string $targetRole
     */
    public function run(?string $targetRole = null): void
    {
        // 1. Đồng bộ permissions từ config
        Artisan::call('permission:sync');

        $allPermissions = Permission::all();

        // 2. Định nghĩa danh sách quyền mặc định cho từng vai trò
        $roleDefaults = [
            'super_admin' => $allPermissions->pluck('code')->toArray(),

            'admin' => [
                'dashboard.index', 'statistics.index',
                'teachers.index', 'teachers.create', 'teachers.edit', 'teachers.delete',
                'students.index', 'students.create', 'students.edit', 'students.delete',
                'subjects.index', 'subjects.create', 'subjects.edit', 'subjects.delete',
                'rooms.index', 'rooms.create', 'rooms.edit', 'rooms.delete',
                'classes.index', 'classes.create', 'classes.edit', 'classes.delete', 'classes.students', 'classes.chat',
                'schedules.index', 'schedules.create', 'schedules.edit', 'schedules.delete',
                'sessions.index', 'sessions.edit', 'attendance.index', 'attendance.save',
                'holidays.index', 'holidays.create', 'holidays.edit', 'holidays.delete',
                'exams.index', 'exams.create', 'exams.edit', 'exams.delete',
                'exam-types.index', 'exam-types.create', 'exam-types.edit', 'exam-types.delete',
                'class-exams.index', 'class-exams.create', 'class-exams.edit', 'class-exams.delete',
                'grading.index', 'grading.grade',
                'online-exam.enter', 'practice-exams.index',
                'tuitions.index', 'tuitions.create', 'tuitions.edit', 'tuitions.delete', 'tuitions.payments',
            ],

            'teacher' => [
                'dashboard.index',
                'students.index',
                'classes.index', 'classes.chat',
                'schedules.index',
                'sessions.index', 'attendance.index', 'attendance.save',
                'exams.index', 'exams.create', 'exams.edit', 'exams.delete',
                'class-exams.index', 'class-exams.create', 'class-exams.edit', 'class-exams.delete',
                'grading.index', 'grading.grade',
                'online-exam.enter', 'practice-exams.index',
            ],

            'student' => [
                'dashboard.index',
                'classes.index', 'classes.chat',
                'online-exam.enter', 'practice-exams.index',
            ],
        ];

        $rolesToSeed = ($targetRole && isset($roleDefaults[$targetRole]))
            ? [$targetRole => $roleDefaults[$targetRole]]
            : $roleDefaults;

        foreach ($rolesToSeed as $role => $codes) {
            $permissionIds = $allPermissions->whereIn('code', $codes)->pluck('id');

            // Xóa quyền cũ của role và gán lại quyền chuẩn
            RolePermission::where('role', $role)->delete();

            $records = [];
            $now     = now();

            foreach ($permissionIds as $permId) {
                $records[] = [
                    'role'          => $role,
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

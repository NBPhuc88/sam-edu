<?php

namespace App\Services\Statistic;

use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Support\Facades\Auth;

class StatisticService implements StatisticServiceInterface
{
    /**
     * @param  ?int                 $selectedCenterId
     * @return array<string, mixed>
     */
    public function getStatisticData(?int $selectedCenterId = null): array
    {
        $user = null;
        $role = 'admin';

        if (Auth::guard('admin')->check()) {
            $role = 'admin';
            /** @var Admin $user */
            $user = Auth::guard('admin')->user();
        } elseif (Auth::guard('teacher')->check()) {
            $role = 'teacher';
            /** @var Teacher $user */
            $user = Auth::guard('teacher')->user();
        } elseif (Auth::guard('student')->check()) {
            return [
                'forbidden' => true,
                'message'   => 'Bạn không có quyền truy cập vào trang thống kê báo cáo quản trị.',
            ];
        }

        $allowedCenterIds = [];
        $isSuperAdmin     = false;

        if ($role === 'admin' && $user instanceof Admin) {
            $isSuperAdmin = $user->role === 'super_admin';

            if ($isSuperAdmin) {
                $allowedCenterIds = Center::pluck('id')->toArray();
            } else {
                $allowedCenterIds = $user->centers()->pluck('centers.id')->toArray();
            }
        } elseif ($user instanceof Teacher) {
            $allowedCenterIds = [$user->center_id];
        }

        if ($selectedCenterId && in_array($selectedCenterId, $allowedCenterIds, true)) {
            $activeCenterIds = [$selectedCenterId];
        } else {
            $activeCenterIds = $allowedCenterIds;
        }

        $centersQuery = Center::whereIn('id', $activeCenterIds)->withCount(['students', 'classes', 'teachers']);
        $centers      = $centersQuery->get();

        $centerStats = $centers->map(function (Center $center) {
            return [
                'id'            => $center->id,
                'code'          => $center->code,
                'name'          => $center->name,
                'student_count' => $center->students_count,
                'class_count'   => $center->classes_count,
                'teacher_count' => $center->teachers_count,
            ];
        });

        $classesQuery = SchoolClass::whereIn('center_id', $activeCenterIds)->with(['center'])->withCount('students');

        if ($user instanceof Teacher) {
            $teacherClassIds = $user->classSubjects()->pluck('class_id')->unique()->toArray();
            $classesQuery->whereIn('id', $teacherClassIds);
        }

        $classes = $classesQuery->get();

        $classStats = $classes->map(function (SchoolClass $schoolClass) {
            $studentCount  = (int) $schoolClass->students_count;
            $maxCapacity   = (int) ($schoolClass->max_students ?: 30);
            $occupancyRate = min(100, (int) round(($studentCount / $maxCapacity) * 100));

            return [
                'id'             => $schoolClass->id,
                'code'           => $schoolClass->code,
                'name'           => $schoolClass->name,
                'center_name'    => $schoolClass->center->name ?? 'N/A',
                'center_code'    => $schoolClass->center->code ?? 'N/A',
                'student_count'  => $studentCount,
                'max_capacity'   => $maxCapacity,
                'occupancy_rate' => $occupancyRate,
                'status'         => $schoolClass->status,
            ];
        });

        return [
            'forbidden'        => false,
            'role'             => $role,
            'isSuperAdmin'     => $isSuperAdmin,
            'allowedCenters'   => Center::whereIn('id', $allowedCenterIds)->get(['id', 'code', 'name']),
            'centerStats'      => $centerStats,
            'classStats'       => $classStats,
            'selectedCenterId' => $selectedCenterId ? (int) $selectedCenterId : null,
        ];
    }
}

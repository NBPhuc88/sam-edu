<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StatisticController extends Controller
{
    /**
     * Display role-scoped student statistics page (by Center & by Class).
     * @param Request $request
     */
    public function index(Request $request): Response
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
            // Block student access with 403 Forbidden
            return Inertia::render('Error', [
                'status'  => 403,
                'message' => 'Bạn không có quyền truy cập vào trang thống kê báo cáo quản trị.',
            ]);
        }

        // Determine Allowed Center IDs based on role & permissions
        $allowedCenterIds = [];
        $isSuperAdmin     = false;

        if ($role === 'admin' && $user instanceof Admin) {
            // Super Admin: role = 'super_admin' (column trực tiếp, không qua RBAC)
            $isSuperAdmin = $user->role === 'super_admin';

            if ($isSuperAdmin) {
                $allowedCenterIds = Center::pluck('id')->toArray();
            } else {
                $allowedCenterIds = $user->centers()->pluck('centers.id')->toArray();
            }
        } elseif ($user instanceof Teacher) {
            $allowedCenterIds = [$user->center_id];
        }

        // Selected Center Filter from Query String
        $selectedCenterId = $request->query('center_id');

        if ($selectedCenterId && in_array((int) $selectedCenterId, $allowedCenterIds)) {
            $activeCenterIds = [(int) $selectedCenterId];
        } else {
            $activeCenterIds = $allowedCenterIds;
        }

        // 1. Center Level Statistics
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

        // 2. Class Level Statistics
        $classesQuery = SchoolClass::whereIn('center_id', $activeCenterIds)->with(['center'])->withCount('students');

        if ($user instanceof Teacher) {
            // Filter classes where teacher teaches a class_subject
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

        return Inertia::render('Admin/Statistics', [
            'role'             => $role,
            'isSuperAdmin'     => $isSuperAdmin,
            'allowedCenters'   => Center::whereIn('id', $allowedCenterIds)->get(['id', 'code', 'name']),
            'centerStats'      => $centerStats,
            'classStats'       => $classStats,
            'selectedCenterId' => $selectedCenterId ? (int) $selectedCenterId : null,
        ]);
    }
}

<?php

namespace App\Services\Dashboard;

use App\Models\Admin;
use App\Models\Center;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Facades\Auth;

class DashboardService implements DashboardServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function getDashboardData(): array
    {
        $role = 'admin';
        $user = null;

        if (Auth::guard('admin')->check()) {
            $role = 'admin';
            /** @var Admin $user */
            $user = Auth::guard('admin')->user();
        } elseif (Auth::guard('teacher')->check()) {
            $role = 'teacher';
            /** @var Teacher $user */
            $user = Auth::guard('teacher')->user();
        } elseif (Auth::guard('student')->check()) {
            $role = 'student';
            /** @var Student $user */
            $user = Auth::guard('student')->user();
        }

        $centerCount  = Center::count();
        $studentCount = Student::count();
        $teacherCount = Teacher::count();
        $classCount   = SchoolClass::count();
        $roomCount    = Room::count();

        $center = null;

        if ($role === 'admin' && $user instanceof Admin) {
            $isSuperAdmin = $user->role === 'super_admin';

            if (! $isSuperAdmin) {
                $center = $user->centers()->first();
            }
        } elseif ($role === 'teacher' && isset($user->center_id)) {
            $center = Center::find($user->center_id);
        } elseif ($role === 'student' && isset($user->center_id)) {
            $center = Center::find($user->center_id);
        }

        $centerData = null;

        if ($center) {
            $expiresAt = $center->expires_at;
            $isExpired = $expiresAt ? $expiresAt->isPast() : false;

            $daysRemaining     = $expiresAt ? (int) max(0, ceil(now()->diffInHours($expiresAt, false) / 24)) : 999;
            $expiringSoon      = $expiresAt ? (! $isExpired && $daysRemaining <= 7) : false;
            $expiring1DayAlert = $expiresAt ? (! $isExpired && $daysRemaining <= 1) : false;

            $centerData = [
                'id'                => $center->id,
                'code'              => $center->code,
                'name'              => $center->name,
                'subscription_plan' => $center->subscription_plan,
                'expires_at'        => $expiresAt ? $expiresAt->toIso8601String() : null,
                'is_expired'        => $isExpired,
                'expiring_soon'     => $expiringSoon,
                'expiring_1day'     => $expiring1DayAlert,
                'days_remaining'    => $daysRemaining,
            ];
        }

        $monthlyEnrollments = [];

        for ($i = 5; $i >= 0; $i--) {
            $targetDate = now()->subMonths($i);
            $monthLabel = 'Thg ' . $targetDate->format('n');

            $count = Student::whereYear('created_at', $targetDate->year)
                ->whereMonth('created_at', $targetDate->month)
                ->count();

            $monthlyEnrollments[] = [
                'month'    => $monthLabel,
                'students' => $count,
            ];
        }

        $recentClasses = SchoolClass::with('center')->latest()->take(5)->get();

        return [
            'center' => $centerData,
            'stats'  => [
                'centers'  => $centerCount,
                'students' => $studentCount,
                'teachers' => $teacherCount,
                'classes'  => $classCount,
                'rooms'    => $roomCount,
            ],
            'monthlyEnrollments' => $monthlyEnrollments,
            'recentClasses'      => $recentClasses,
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Center;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the main dashboard based on authenticated role.
     */
    public function index(Request $request): Response
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

        // Get center statistics
        $centerCount = Center::count();
        $studentCount = Student::count();
        $teacherCount = Teacher::count();
        $classCount = SchoolClass::count();
        $roomCount = Room::count();

        /** @var Center|null $center */
        $center = Center::first();

        // Tính toán thống kê nhập học thực tế theo 6 tháng gần nhất từ CSDL
        $monthlyEnrollments = [];
        for ($i = 5; $i >= 0; $i--) {
            $targetDate = now()->subMonths($i);
            $monthLabel = 'Thg '.$targetDate->format('n');

            $count = Student::whereYear('created_at', $targetDate->year)
                ->whereMonth('created_at', $targetDate->month)
                ->count();

            $monthlyEnrollments[] = [
                'month' => $monthLabel,
                'students' => $count,
            ];
        }

        $recentClasses = SchoolClass::with('center')->latest()->take(5)->get();

        return Inertia::render('Dashboard', [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'full_name' => $user->full_name ?? $user->username,
                    'role' => $role,
                    'avatar' => $user->avatar ?? null,
                ] : null,
                'role' => $role,
            ],
            'center' => $center ? [
                'id' => $center->id,
                'code' => $center->code,
                'name' => $center->name,
                'subscription_plan' => $center->subscription_plan,
                'expires_at' => $center->expires_at ? $center->expires_at->toIso8601String() : null,
                'is_expired' => $center->expires_at ? $center->expires_at->isPast() : false,
            ] : null,
            'stats' => [
                'centers' => $centerCount,
                'students' => $studentCount,
                'teachers' => $teacherCount,
                'classes' => $classCount,
                'rooms' => $roomCount,
            ],
            'monthlyEnrollments' => $monthlyEnrollments,
            'recentClasses' => $recentClasses,
        ]);
    }
}

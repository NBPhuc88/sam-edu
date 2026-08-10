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

        $monthlyEnrollments = [
            ['month' => 'Thg 1', 'students' => 45],
            ['month' => 'Thg 2', 'students' => 52],
            ['month' => 'Thg 3', 'students' => 61],
            ['month' => 'Thg 4', 'students' => 75],
            ['month' => 'Thg 5', 'students' => 90],
            ['month' => 'Thg 6', 'students' => 110],
        ];

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

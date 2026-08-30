<?php

use App\Enums\Constant;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentTuition;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->center = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Trung Tam Test Hoc Phi Student',
        'status' => Constant::STATUS_ACTIVE,
    ]);

    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_portal_' . random_int(1000, 9999),
        'first_name'   => 'Van A',
        'last_name'    => 'Nguyen',
        'full_name'    => 'Nguyen Van A',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    // Tạo 7 lớp học và 7 khoản học phí cho học sinh này
    $this->tuitions = collect();

    for ($i = 1; $i <= 7; $i++) {
        $class = SchoolClass::create([
            'center_id' => $this->center->id,
            'code'      => 'CLS' . random_int(1000000, 9999999),
            'name'      => 'Lop Hoc Thu ' . $i,
            'status'    => 1,
        ]);

        $tuition = StudentTuition::create([
            'center_id'        => $this->center->id,
            'student_id'       => $this->student->id,
            'class_id'         => $class->id,
            'title'            => 'Hoc phi mon hoc ' . $i,
            'total_amount'     => 1000000 * $i,
            'paid_amount'      => 0,
            'remaining_amount' => 1000000 * $i,
            'status'           => Constant::TUITION_STATUS_PENDING,
            'due_date'         => now()->addDays(15)->format('Y-m-d'),
        ]);

        $this->tuitions->push($tuition);
    }
});

test('student can view all 7 tuition records in student tuitions portal', function () {
    $response = $this->actingAs($this->student, 'student')
        ->get(route('student.tuitions.index'));

    $response->assertOk();
    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Student/Tuitions/Index')
        ->has('tuitions.data', 7)
        ->where('stats.unpaid_count', 7)
        ->where('stats.total_invoiced', 28000000)
        ->where('stats.total_remaining', 28000000)
        ->where('stats.total_paid', 0)
    );
});

test('student can filter tuition by search term and status', function () {
    $firstTuition = $this->tuitions->first();

    $response = $this->actingAs($this->student, 'student')
        ->get(route('student.tuitions.index', [
            'search' => $firstTuition->title,
            'status' => Constant::TUITION_STATUS_PENDING,
        ]));

    $response->assertOk();
    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Student/Tuitions/Index')
        ->has('tuitions.data', 1)
        ->where('tuitions.data.0.id', $firstTuition->id)
    );
});

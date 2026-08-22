<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * TestCenterSeeder
 *
 * Tạo dữ liệu test:
 * - 1 Trung tâm Tiếng Anh
 * - 1 Admin phụ (role = admin) phân công cho trung tâm
 * - 5 Giáo viên
 * - 5 Môn học (Tiếng Anh cấp độ khác nhau)
 * - 5 Phòng học
 * - 5 Lớp học (mỗi lớp 1 môn, 1 giáo viên, 30 học sinh)
 * - Lịch học 3 buổi tối/tuần, giáo viên không trùng lịch
 * - 5 Bài thi: 4 bài đơn kỹ năng + 1 bài đầy đủ 4 kỹ năng
 */
class TestCenterSeeder extends Seeder
{
    private Carbon $now;

    public function __construct()
    {
        $this->now = Carbon::now();
    }

    public function run(): void
    {
        $this->command->info('🚀 Bắt đầu seed dữ liệu test...');

        DB::transaction(function () {
            $center   = $this->createCenter();
            $admin    = $this->createSubAdmin($center);
            $rooms    = $this->createRooms($center);
            $subjects = $this->createSubjects($center);
            $teachers = $this->createTeachers($center);
            $classes  = $this->createClasses($center, $subjects, $teachers, $rooms);
            $this->createStudentsAndEnroll($center, $classes);
            $this->createSchedules($classes, $rooms);
            $this->createExams($center, $classes, $teachers);
        });

        $this->command->info('✅ Seed hoàn tất!');
        $this->printSummary();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CENTER
    // ─────────────────────────────────────────────────────────────────────────

    private function createCenter(): object
    {
        $this->command->info('  → Tạo trung tâm...');

        $id = DB::table('centers')->insertGetId([
            'code'              => 'CTR000000001',
            'name'              => 'Trung tâm Anh ngữ Sam',
            'phone'             => '0909123456',
            'email'             => 'samlanguage@example.com',
            'address'           => '123 Nguyễn Huệ, Quận 1, TP.HCM',
            'status'            => 'active',
            'subscription_plan' => 'professional',
            'expires_at'        => Carbon::now()->addYear(),
            'max_students'      => 500,
            'max_classes'       => 50,
            'created_at'        => $this->now,
            'updated_at'        => $this->now,
        ]);

        return (object) ['id' => $id, 'name' => 'Trung tâm Anh ngữ Sam'];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN PHỤ
    // ─────────────────────────────────────────────────────────────────────────

    private function createSubAdmin(object $center): object
    {
        $this->command->info('  → Tạo admin phụ...');

        $adminId = DB::table('admins')->insertGetId([
            'username'   => 'admin_sam',
            'email'      => 'admin@samlanguage.com',
            'password'   => Hash::make('password'),
            'admin_code' => 'ADM000000001',
            'full_name'  => 'Nguyễn Văn Quản Trị',
            'phone'      => '0901000001',
            'role'       => 'admin',
            'status'     => 'active',
            'created_at' => $this->now,
            'updated_at' => $this->now,
        ]);

        DB::table('admin_centers')->insert([
            'admin_id'   => $adminId,
            'center_id'  => $center->id,
            'created_at' => $this->now,
            'updated_at' => $this->now,
        ]);

        return (object) ['id' => $adminId];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHÒNG HỌC
    // ─────────────────────────────────────────────────────────────────────────

    private function createRooms(object $center): array
    {
        $this->command->info('  → Tạo phòng học...');

        $rooms = [];

        for ($i = 1; $i <= 5; $i++) {
            $id = DB::table('rooms')->insertGetId([
                'center_id'  => $center->id,
                'code'       => sprintf('R%09d', $i),
                'name'       => "Phòng {$i}",
                'capacity'   => 35,
                'location'   => 'Tầng ' . ceil($i / 2) . ', Tòa nhà A',
                'status'     => 'active',
                'created_at' => $this->now,
                'updated_at' => $this->now,
            ]);
            $rooms[] = (object) ['id' => $id, 'code' => sprintf('R%09d', $i)];
        }

        return $rooms;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MÔN HỌC (Tiếng Anh 5 cấp độ)
    // ─────────────────────────────────────────────────────────────────────────

    private function createSubjects(object $center): array
    {
        $this->command->info('  → Tạo môn học (5 cấp độ Tiếng Anh)...');

        $levels = [
            ['code' => 'S000000001', 'name' => 'Tiếng Anh Mất Gốc (Pre-A1)', 'fee' => 1500000, 'sessions' => 30],
            ['code' => 'S000000002', 'name' => 'Tiếng Anh Cơ Bản (A1-A2)', 'fee' => 2000000, 'sessions' => 36],
            ['code' => 'S000000003', 'name' => 'Tiếng Anh Giao Tiếp (B1)', 'fee' => 2500000, 'sessions' => 40],
            ['code' => 'S000000004', 'name' => 'Tiếng Anh Nâng Cao (B2)', 'fee' => 3000000, 'sessions' => 48],
            ['code' => 'S000000005', 'name' => 'Luyện Thi IELTS (C1)', 'fee' => 4000000, 'sessions' => 60],
        ];

        $subjects = [];

        foreach ($levels as $level) {
            $id = DB::table('subjects')->insertGetId([
                'center_id'        => $center->id,
                'code'             => $level['code'],
                'name'             => $level['name'],
                'description'      => "Chương trình {$level['name']}",
                'total_sessions'   => $level['sessions'],
                'duration_minutes' => 90,
                'tuition_fee'      => $level['fee'],
                'status'           => 'active',
                'created_at'       => $this->now,
                'updated_at'       => $this->now,
            ]);
            $subjects[] = (object) array_merge($level, ['id' => $id]);
        }

        return $subjects;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GIÁO VIÊN
    // ─────────────────────────────────────────────────────────────────────────

    private function createTeachers(object $center): array
    {
        $this->command->info('  → Tạo 5 giáo viên...');

        $teacherData = [
            ['first_name' => 'Trần', 'last_name' => 'Minh Tuấn', 'gender' => 'male'],
            ['first_name' => 'Lê', 'last_name' => 'Thị Thu Hà', 'gender' => 'female'],
            ['first_name' => 'Phạm', 'last_name' => 'Quốc Bảo', 'gender' => 'male'],
            ['first_name' => 'Nguyễn', 'last_name' => 'Thị Lan Anh', 'gender' => 'female'],
            ['first_name' => 'Hoàng', 'last_name' => 'Văn Đức', 'gender' => 'male'],
        ];

        $teachers = [];

        foreach ($teacherData as $i => $data) {
            $idx      = $i + 1;
            $fullName = $data['first_name'] . ' ' . $data['last_name'];
            $username = 'teacher' . $idx . '_sam';

            $id = DB::table('teachers')->insertGetId([
                'center_id'      => $center->id,
                'teacher_code'   => sprintf('GV%09d', $idx),
                'username'       => $username,
                'email'          => "teacher{$idx}@samlanguage.com",
                'password'       => Hash::make('password'),
                'first_name'     => $data['first_name'],
                'last_name'      => $data['last_name'],
                'full_name'      => $fullName,
                'gender'         => $data['gender'],
                'phone'          => sprintf('090200000%d', $idx),
                'hire_date'      => Carbon::now()->subYears(rand(1, 5))->format('Y-m-d'),
                'specialization' => 'Tiếng Anh',
                'status'         => 'active',
                'created_at'     => $this->now,
                'updated_at'     => $this->now,
            ]);
            $teachers[] = (object) ['id' => $id, 'full_name' => $fullName];
        }

        return $teachers;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LỚP HỌC + CLASS_SUBJECTS
    // ─────────────────────────────────────────────────────────────────────────

    private function createClasses(object $center, array $subjects, array $teachers, array $rooms): array
    {
        $this->command->info('  → Tạo 5 lớp học + phân công class_subjects...');

        $classNames = [
            'Lớp Mất Gốc K01',
            'Lớp Cơ Bản K01',
            'Lớp Giao Tiếp K01',
            'Lớp Nâng Cao K01',
            'Lớp IELTS K01',
        ];

        $startDate = Carbon::now()->startOfWeek()->addWeek();

        $classes = [];

        foreach ($subjects as $i => $subject) {
            $teacher = $teachers[$i]; // Mỗi lớp 1 giáo viên riêng (5 lớp – 5 giáo viên)

            $classId = DB::table('classes')->insertGetId([
                'center_id'    => $center->id,
                'code'         => sprintf('C%09d', $i + 1),
                'name'         => $classNames[$i],
                'description'  => "Lớp {$classNames[$i]} - {$subject->name}",
                'max_students' => 35,
                'start_date'   => $startDate->format('Y-m-d'),
                'end_date'     => $startDate->copy()->addMonths(4)->format('Y-m-d'),
                'status'       => 1, // 1 = active (tinyint)
                'created_at'   => $this->now,
                'updated_at'   => $this->now,
            ]);

            // class_subjects: liên kết lớp - môn - giáo viên
            $classSubjectId = DB::table('class_subjects')->insertGetId([
                'class_id'   => $classId,
                'subject_id' => $subject->id,
                'teacher_id' => $teacher->id,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date'   => $startDate->copy()->addMonths(4)->format('Y-m-d'),
                'status'     => 'active',
                'created_at' => $this->now,
                'updated_at' => $this->now,
            ]);

            $classes[] = (object) [
                'id'               => $classId,
                'name'             => $classNames[$i],
                'subject_id'       => $subject->id,
                'teacher_id'       => $teacher->id,
                'class_subject_id' => $classSubjectId,
                'start_date'       => $startDate->format('Y-m-d'),
                'room'             => $rooms[$i],
                'teacher'          => $teacher,
                'index'            => $i,
            ];
        }

        return $classes;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HỌC SINH (30 hs/lớp) + GVDT
    // ─────────────────────────────────────────────────────────────────────────

    private function createStudentsAndEnroll(object $center, array $classes): void
    {
        $this->command->info('  → Tạo học sinh (30/lớp) và ghi danh...');

        $vietnameseFirstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
        $maleLastNames        = ['Minh Tuấn', 'Quốc Bảo', 'Văn Đức', 'Hữu Nghĩa', 'Thanh Long', 'Công Vinh', 'Đình Khôi'];
        $femaleLastNames      = ['Thu Hà', 'Lan Anh', 'Mỹ Linh', 'Thùy Dương', 'Bảo Châu', 'Khánh Linh', 'Phương Anh'];
        $relationships        = ['Bố', 'Mẹ', 'Ông', 'Bà'];

        $studentCounter = 0;

        foreach ($classes as $class) {
            for ($j = 1; $j <= 30; $j++) {
                $studentCounter++;
                $isMale    = $studentCounter % 2 === 0;
                $firstName = $vietnameseFirstNames[array_rand($vietnameseFirstNames)];
                $lastName  = $isMale
                    ? $maleLastNames[array_rand($maleLastNames)]
                    : $femaleLastNames[array_rand($femaleLastNames)];
                $fullName = $firstName . ' ' . $lastName;
                $username = 'hs' . str_pad($studentCounter, 6, '0', STR_PAD_LEFT);
                $dob      = Carbon::now()->subYears(rand(10, 18))->subDays(rand(0, 365))->format('Y-m-d');

                $studentId = DB::table('students')->insertGetId([
                    'center_id'           => $center->id,
                    'student_code'        => sprintf('HS%09d', $studentCounter),
                    'username'            => $username,
                    'email'               => "{$username}@samlanguage.com",
                    'password'            => Hash::make('password'),
                    'first_name'          => $firstName,
                    'last_name'           => $lastName,
                    'full_name'           => $fullName,
                    'date_of_birth'       => $dob,
                    'gender'              => $isMale ? 'male' : 'female',
                    'phone'               => sprintf('09%08d', $studentCounter),
                    'address'             => 'TP.HCM',
                    'parent_name'         => 'Phụ huynh ' . $firstName,
                    'parent_phone'        => sprintf('08%08d', $studentCounter),
                    'parent_relationship' => $relationships[array_rand($relationships)],
                    'admission_date'      => $class->start_date,
                    'status'              => 1, // 1 = active (tinyint)
                    'created_at'          => $this->now,
                    'updated_at'          => $this->now,
                ]);

                DB::table('class_students')->insert([
                    'class_id'    => $class->id,
                    'student_id'  => $studentId,
                    'enrolled_at' => $this->now,
                    'status'      => 'active',
                    'created_at'  => $this->now,
                    'updated_at'  => $this->now,
                ]);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LỊCH HỌC (3 buổi tối/tuần, giáo viên không trùng)
    //
    // Schema mới: 1 bản ghi per lớp với cột weeks (JSON map).
    // Format weeks: {"dayKey": [["HH:MM", "HH:MM"], ...], ...}
    // dayKey: "1"=Mon, "2"=Tue, "3"=Wed, "4"=Thu, "5"=Fri, "6"=Sat, "7"=Sun
    //
    // Lớp 1 (Mất Gốc)  : Thứ 2-4-6, 18:00–19:30
    // Lớp 2 (Cơ Bản)   : Thứ 3-5-7, 18:00–19:30
    // Lớp 3 (Giao Tiếp): Thứ 2-4-6, 19:30–21:00
    // Lớp 4 (Nâng Cao) : Thứ 3-5-7, 19:30–21:00
    // Lớp 5 (IELTS)    : Thứ 2-4-6, 20:00–21:30
    // ─────────────────────────────────────────────────────────────────────────

    private function createSchedules(array $classes, array $rooms): void
    {
        $this->command->info('  → Tạo lịch học (3 buổi/tuần, schema weeks JSON mới)...');

        /**
         * weeks format: {"dayKey": [["HH:MM", "HH:MM"], ...]}
         * dayKey: "1"=Mon, "2"=Tue, "3"=Wed, "4"=Thu, "5"=Fri, "6"=Sat, "7"=Sun
         * Phân bổ để giáo viên và phòng học không xung đột:
         * - Lớp 0,2,4: Thứ 2-4-6
         * - Lớp 1,3:   Thứ 3-5-7
         */
        $scheduleMap = [
            0 => ['weekdays' => ['1', '3', '5'], 'start' => '18:00', 'end' => '19:30'],
            1 => ['weekdays' => ['2', '4', '6'], 'start' => '18:00', 'end' => '19:30'],
            2 => ['weekdays' => ['1', '3', '5'], 'start' => '19:30', 'end' => '21:00'],
            3 => ['weekdays' => ['2', '4', '6'], 'start' => '19:30', 'end' => '21:00'],
            4 => ['weekdays' => ['1', '3', '5'], 'start' => '20:00', 'end' => '21:30'],
        ];

        foreach ($classes as $i => $class) {
            $schedule = $scheduleMap[$i];
            $room     = $rooms[$i];

            // Xây dựng weeks JSON: {"1": [["18:00", "19:30"]], "3": [...], ...}
            $weeks = [];

            foreach ($schedule['weekdays'] as $dayKey) {
                $weeks[$dayKey] = [[$schedule['start'], $schedule['end']]];
            }

            DB::table('class_schedules')->insert([
                'class_subject_id' => $class->class_subject_id,
                'weeks'            => json_encode($weeks),
                'off_days'         => null,
                'extra_days'       => null,
                'room_id'          => $room->id,
                'status'           => 'active',
                'created_at'       => $this->now,
                'updated_at'       => $this->now,
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BÀI THI (5 bài)
    //
    // Bài 1: Chỉ Nghe (Listening)
    // Bài 2: Chỉ Đọc  (Reading)
    // Bài 3: Chỉ Viết (Writing)
    // Bài 4: Chỉ Nói  (Speaking)
    // Bài 5: Đầy đủ 4 kỹ năng (Listening + Reading + Writing + Speaking)
    // ─────────────────────────────────────────────────────────────────────────

    private function createExams(object $center, array $classes, array $teachers): void
    {
        $this->command->info('  → Tạo 5 bài thi (4 đơn kỹ năng + 1 tổng hợp)...');

        // Đảm bảo Exam Types tồn tại
        foreach (ExamTypeSeeder::getDefaultExamTypes() as $tmpl) {
            DB::table('exam_types')->updateOrInsert(
                ['center_id' => $center->id, 'code' => $tmpl['code']],
                [
                    'name'        => $tmpl['name'],
                    'description' => $tmpl['description'],
                    'status'      => $tmpl['status'],
                    'created_at'  => $this->now,
                    'updated_at'  => $this->now,
                ]
            );
        }

        $generalExamTypeId = (int) (DB::table('exam_types')->where('center_id', $center->id)->where('code', 'general')->value('id') ?? DB::table('exam_types')->where('center_id', $center->id)->value('id'));
        $ieltsExamTypeId   = (int) (DB::table('exam_types')->where('center_id', $center->id)->where('code', 'ielts')->value('id') ?? $generalExamTypeId);

        $singleSkillExams = [
            [
                'skill'    => 'listening',
                'name'     => 'Kiểm Tra Nghe Hiểu',
                'duration' => 45,
                'sections' => [
                    ['title' => 'Part 1 – Short Conversations', 'skill' => 'listening', 'questions' => 10],
                    ['title' => 'Part 2 – Longer Talks', 'skill' => 'listening', 'questions' => 10],
                ],
            ],
            [
                'skill'    => 'reading',
                'name'     => 'Kiểm Tra Đọc Hiểu',
                'duration' => 60,
                'sections' => [
                    ['title' => 'Part 1 – Short Passages', 'skill' => 'reading', 'questions' => 10],
                    ['title' => 'Part 2 – Long Passages', 'skill' => 'reading', 'questions' => 10],
                ],
            ],
            [
                'skill'    => 'writing',
                'name'     => 'Kiểm Tra Viết',
                'duration' => 60,
                'sections' => [
                    ['title' => 'Task 1 – Sentence Building', 'skill' => 'writing', 'questions' => 5],
                    ['title' => 'Task 2 – Essay Outline', 'skill' => 'writing', 'questions' => 5],
                ],
            ],
            [
                'skill'    => 'speaking',
                'name'     => 'Kiểm Tra Nói',
                'duration' => 30,
                'sections' => [
                    ['title' => 'Part 1 – Personal Questions', 'skill' => 'speaking', 'questions' => 5],
                    ['title' => 'Part 2 – Topic Presentation', 'skill' => 'speaking', 'questions' => 5],
                ],
            ],
        ];

        $fullExam = [
            'name'     => 'Kiểm Tra Tổng Hợp 4 Kỹ Năng',
            'duration' => 150,
            'sections' => [
                ['title' => 'Listening – Conversations', 'skill' => 'listening', 'questions' => 10],
                ['title' => 'Reading – Text Passages', 'skill' => 'reading', 'questions' => 10],
                ['title' => 'Writing – Guided Tasks', 'skill' => 'writing', 'questions' => 5],
                ['title' => 'Speaking – Oral Questions', 'skill' => 'speaking', 'questions' => 5],
            ],
        ];

        $examDate  = Carbon::parse($classes[0]->start_date)->addMonths(2);
        $teacherId = $teachers[0]->id;

        // Tạo 4 bài đơn kỹ năng – gán cho lớp tương ứng
        foreach ($singleSkillExams as $i => $def) {
            $classForExam = $classes[$i];
            $examId       = $this->insertExam(
                centerId: $center->id,
                classId: $classForExam->id,
                subjectId: $classForExam->subject_id,
                classSubjectId: $classForExam->class_subject_id,
                name: $def['name'],
                examTypeId: $generalExamTypeId,
                duration: $def['duration'],
                examDate: $examDate->copy()->addWeeks($i)->format('Y-m-d'),
                teacherId: $teacherId,
            );
            $this->insertSectionsAndQuestions($examId, $def['sections']);
        }

        // Tạo 1 bài thi tổng hợp – gán cho lớp IELTS (lớp 5, index 4)
        $listeningClass = $classes[4];
        $fullExamId     = $this->insertExam(
            centerId: $center->id,
            classId: $listeningClass->id,
            subjectId: $listeningClass->subject_id,
            classSubjectId: $listeningClass->class_subject_id,
            name: $fullExam['name'],
            examTypeId: $ieltsExamTypeId,
            duration: $fullExam['duration'],
            examDate: $examDate->copy()->addMonths(1)->format('Y-m-d'),
            teacherId: $teacherId,
        );
        $this->insertSectionsAndQuestions($fullExamId, $fullExam['sections']);
    }

    /**
     * @param int      $centerId
     * @param int      $classId
     * @param int      $subjectId
     * @param int      $classSubjectId
     * @param string   $name
     * @param int|null $examTypeId
     * @param int      $duration
     * @param string   $examDate
     * @param int      $teacherId
     */
    private function insertExam(
        int $centerId,
        int $classId,
        int $subjectId,
        int $classSubjectId,
        string $name,
        ?int $examTypeId,
        int $duration,
        string $examDate,
        int $teacherId,
    ): int {
        return DB::table('exams')->insertGetId([
            'center_id'             => $centerId,
            'class_id'              => $classId,
            'subject_id'            => $subjectId,
            'class_subject_id'      => $classSubjectId,
            'name'                  => $name,
            'exam_type_id'          => $examTypeId,
            'description'           => "Bài thi: {$name}",
            'exam_date'             => $examDate,
            'duration_minutes'      => $duration,
            'max_score'             => 10.00,
            'pass_score'            => 5.00,
            'shuffle_questions'     => false,
            'shuffle_options'       => false,
            'max_attempts'          => 1,
            'status'                => 'published',
            'created_by_teacher_id' => $teacherId,
            'created_at'            => $this->now,
            'updated_at'            => $this->now,
        ]);
    }

    /**
     * @param int                                                             $examId
     * @param array<int, array{title: string, skill: string, questions: int}> $sections
     */
    private function insertSectionsAndQuestions(int $examId, array $sections): void
    {
        $questionTypes = ['single_choice', 'multiple_choice', 'true_false_not_given'];

        foreach ($sections as $sectionOrder => $sectionDef) {
            $sectionId = DB::table('exam_sections')->insertGetId([
                'exam_id'     => $examId,
                'title'       => $sectionDef['title'],
                'description' => "Phần {$sectionDef['skill']}: {$sectionDef['title']}",
                'skill'       => $sectionDef['skill'],
                'order_index' => $sectionOrder,
                'created_at'  => $this->now,
                'updated_at'  => $this->now,
            ]);

            for ($q = 1; $q <= $sectionDef['questions']; $q++) {
                $questionType              = $questionTypes[($q - 1) % count($questionTypes)];
                [$options, $correctAnswer] = $this->buildQuestionOptions($questionType, $sectionDef['skill'], $q);

                DB::table('exam_questions')->insert([
                    'exam_id'        => $examId,
                    'section_id'     => $sectionId,
                    'code'           => null,
                    'question_type'  => $questionType,
                    'skill'          => $sectionDef['skill'],
                    'content'        => $this->generateQuestionContent($sectionDef['skill'], $questionType, $q),
                    'score'          => 1.00,
                    'options'        => json_encode($options),
                    'correct_answer' => json_encode($correctAnswer),
                    'explanation'    => 'Đáp án dựa trên nội dung đã học.',
                    'order_index'    => (($sectionOrder * 100) + $q),
                    'created_at'     => $this->now,
                    'updated_at'     => $this->now,
                ]);
            }
        }
    }

    /**
     * @return array{0: list<array{key: string, text: string}>, 1: string|list<string>}
     * @param  string                                                                   $type
     * @param  string                                                                   $skill
     * @param  int                                                                      $qNum
     */
    private function buildQuestionOptions(string $type, string $skill, int $qNum): array
    {
        if ($type === 'true_false_not_given' || $type === 'true_false') {
            return [
                [['id' => 'TRUE', 'label' => 'TRUE (Đúng)'], ['id' => 'FALSE', 'label' => 'FALSE (Sai)'], ['id' => 'NOT_GIVEN', 'label' => 'NOT GIVEN (Không có thông tin)']],
                $qNum % 2 === 0 ? 'TRUE' : 'FALSE',
            ];
        }

        $optionSets = [
            'listening' => [
                ['A' => 'At a restaurant', 'B' => 'In a park', 'C' => 'At a school', 'D' => 'At a hospital'],
                ['A' => 'To ask for directions', 'B' => 'To order food', 'C' => 'To buy tickets', 'D' => 'To make a complaint'],
            ],
            'reading' => [
                ['A' => 'The author supports it', 'B' => 'The author opposes it', 'C' => 'The author is neutral', 'D' => 'Not mentioned'],
                ['A' => 'In paragraph 1', 'B' => 'In paragraph 2', 'C' => 'In paragraph 3', 'D' => 'In paragraph 4'],
            ],
            'writing' => [
                ['A' => 'Subject + Verb', 'B' => 'Verb + Subject', 'C' => 'Object + Subject', 'D' => 'Adverb + Verb'],
                ['A' => 'Introduction', 'B' => 'Body paragraph', 'C' => 'Conclusion', 'D' => 'Thesis statement'],
            ],
            'speaking' => [
                ['A' => 'Formal tone', 'B' => 'Informal tone', 'C' => 'Academic tone', 'D' => 'Technical tone'],
                ['A' => 'Past tense', 'B' => 'Present tense', 'C' => 'Future tense', 'D' => 'Perfect tense'],
            ],
        ];

        $setIndex = ($qNum - 1) % 2;
        $rawSet   = $optionSets[$skill][$setIndex] ?? $optionSets['reading'][$setIndex];
        $options  = [];

        foreach ($rawSet as $key => $text) {
            $options[] = ['id' => $key, 'text' => $text];
        }

        $correctKeys = array_keys($rawSet);

        if ($type === 'multiple_choice') {
            $correct = [$correctKeys[0], $correctKeys[1]];
        } else {
            $correct = $correctKeys[$qNum % count($correctKeys)];
        }

        return [$options, $correct];
    }

    private function generateQuestionContent(string $skill, string $type, int $num): string
    {
        $templates = [
            'listening' => "Câu {$num}: Nghe đoạn hội thoại và trả lời: Người nói đang ở đâu?",
            'reading'   => "Câu {$num}: Đọc đoạn văn sau và trả lời: Tác giả muốn truyền đạt điều gì?",
            'writing'   => "Câu {$num}: Sắp xếp các từ sau thành câu hoàn chỉnh theo cấu trúc đúng.",
            'speaking'  => "Câu {$num}: Hãy trả lời câu hỏi sau bằng tiếng Anh trong 1-2 phút: Bạn thích học tiếng Anh như thế nào?",
        ];

        return $templates[$skill] ?? "Câu {$num}: Câu hỏi số {$num} ({$type})";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────────────────

    private function printSummary(): void
    {
        $this->command->newLine();
        $this->command->line('═══════════════════════════════════════════════════════════');
        $this->command->info('  TÓM TẮT DỮ LIỆU TEST ĐÃ TẠO');
        $this->command->line('═══════════════════════════════════════════════════════════');
        $this->command->line('  Trung tâm  : Trung tâm Anh ngữ Sam');
        $this->command->line('  Admin phụ  : admin_sam / password');
        $this->command->line('  Giáo viên  : teacher1_sam .. teacher5_sam / password');
        $this->command->line('  Học sinh   : hs000001 .. hs000150 / password');
        $this->command->line('  Lớp học    : 5 lớp (30 hs/lớp)');
        $this->command->line('  Lịch học   : 3 buổi tối/tuần, không trùng giáo viên');
        $this->command->line('  Bài thi    : 4 đơn kỹ năng + 1 tổng hợp 4 kỹ năng');
        $this->command->line('───────────────────────────────────────────────────────────');
        $this->command->line('  Lịch học:');
        $this->command->line('    Lớp 1 (Mất Gốc)  : Thứ 2-4-6, 18:00–19:30');
        $this->command->line('    Lớp 2 (Cơ Bản)   : Thứ 3-5-7, 18:00–19:30');
        $this->command->line('    Lớp 3 (Giao Tiếp): Thứ 2-4-6, 19:30–21:00');
        $this->command->line('    Lớp 4 (Nâng Cao)  : Thứ 3-5-7, 19:30–21:00');
        $this->command->line('    Lớp 5 (IELTS)     : Thứ 2-4-6, 20:00–21:30');
        $this->command->line('═══════════════════════════════════════════════════════════');
        $this->command->newLine();
    }
}

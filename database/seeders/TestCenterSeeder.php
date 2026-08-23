<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Center;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamSection;
use App\Models\ExamType;
use App\Models\Holiday;
use App\Models\Room;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * TestCenterSeeder
 *
 * Khởi tạo dữ liệu mẫu thực tế, đồng bộ toàn diện với schema và nghiệp vụ Multi-Center:
 * - 1 Super Admin quản lý toàn cục
 * - 3 Trung tâm tại 3 miền (Hà Nội, TP.HCM, Đà Nẵng)
 * - 3 Admin phụ (role = admin) phân công độc lập cho từng Trung tâm
 * - Phòng học, thiết bị phòng học, môn học, giáo viên, học sinh (kèm thông tin phụ huynh)
 * - Lớp học (SchoolClass, status = 1), học sinh ghi danh, phân công môn
 * - Lịch học cố định, ca học thực tế (quá khứ & tương lai), điểm danh, chat lớp
 * - Ngày nghỉ lễ quốc gia
 * - Danh mục loại đề thi (ExamType)
 * - Ngân hàng đề thi đầy đủ câu trả lời (trừ dạng nói và viết), kỳ thi gán lớp, bài nộp, chấm điểm, bảng điểm
 * - Quản lý học phí (StudentTuition) và lịch sử đóng tiền (TuitionPayment)
 * - Ghi chú học sinh, tài liệu, thông báo và yêu cầu tư vấn
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
        $this->command->info('🚀 [1/9] Bắt đầu khởi tạo dữ liệu mẫu toàn diện...');

        DB::transaction(function () {
            // 1. Super Admin
            $superAdmin = $this->createSuperAdmin();

            // 2. Ngày lễ quốc gia
            $nationalHolidays = $this->createNationalHolidays();

            // 3. Khởi tạo 3 Trung tâm
            $centersData    = $this->getCentersConfiguration();
            $createdCenters = [];

            foreach ($centersData as $cIdx => $cConfig) {
                $this->command->info('🏢 [2/9] Khởi tạo Trung tâm #' . ($cIdx + 1) . ": {$cConfig['name']}...");
                $createdCenters[] = $this->seedCenterComplete($cConfig, $nationalHolidays, $superAdmin);
            }

            // 4. Khởi tạo Yêu cầu tư vấn (Contact Requests)
            $this->createContactRequests();

            // 5. Khởi tạo Thông báo toàn hệ thống
            $this->createGlobalNotifications($superAdmin, $createdCenters);
        });

        $this->command->info('✅ [9/9] Hoàn tất seed toàn bộ cơ sở dữ liệu!');
        $this->printSummary();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SUPER ADMIN
    // ─────────────────────────────────────────────────────────────────────────

    private function createSuperAdmin(): Admin
    {
        $this->command->info('  👑 Tạo Super Admin...');

        return Admin::updateOrCreate(
            ['username' => 'super_admin'],
            [
                'admin_code' => 'ADM000000000',
                'username'   => 'super_admin',
                'email'      => 'superadmin@sam-edu.vn',
                'password'   => Hash::make('password'),
                'full_name'  => 'Ban Quản Trị Tối Cao',
                'phone'      => '0900000000',
                'role'       => 'super_admin',
                'status'     => 'active',
            ]
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. NGÀY LỄ QUỐC GIA
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array<int, Holiday>
     */
    private function createNationalHolidays(): array
    {
        $this->command->info('  🎌 Tạo ngày nghỉ lễ quốc gia...');

        $holidays = [
            [
                'name'         => 'Tết Dương Lịch 2026',
                'date'         => '2026-01-01',
                'year'         => 2026,
                'is_lunar'     => false,
                'is_recurring' => true,
                'description'  => 'Nghỉ Tết Dương Lịch toàn quốc',
            ],
            [
                'name'         => 'Tết Nguyên Đán Bính Ngọ 2026 (Ngày 1)',
                'date'         => '2026-02-15',
                'year'         => 2026,
                'is_lunar'     => true,
                'is_recurring' => false,
                'description'  => 'Nghỉ Tết Âm Lịch',
            ],
            [
                'name'         => 'Tết Nguyên Đán Bính Ngọ 2026 (Ngày 2)',
                'date'         => '2026-02-16',
                'year'         => 2026,
                'is_lunar'     => true,
                'is_recurring' => false,
                'description'  => 'Nghỉ Tết Âm Lịch',
            ],
            [
                'name'         => 'Giỗ Tổ Hùng Vương',
                'date'         => '2026-04-26',
                'year'         => 2026,
                'is_lunar'     => true,
                'is_recurring' => true,
                'description'  => 'Nghỉ Giỗ Tổ Hùng Vương (10/3 Âm lịch)',
            ],
            [
                'name'         => 'Kỷ Niệm Ngày Giải Phóng Miền Nam',
                'date'         => '2026-04-30',
                'year'         => 2026,
                'is_lunar'     => false,
                'is_recurring' => true,
                'description'  => 'Nghỉ lễ 30/4',
            ],
            [
                'name'         => 'Quốc Tế Lao Động',
                'date'         => '2026-05-01',
                'year'         => 2026,
                'is_lunar'     => false,
                'is_recurring' => true,
                'description'  => 'Nghỉ lễ 1/5',
            ],
            [
                'name'         => 'Quốc Khánh 2/9',
                'date'         => '2026-09-02',
                'year'         => 2026,
                'is_lunar'     => false,
                'is_recurring' => true,
                'description'  => 'Nghỉ lễ Quốc Khánh 2/9',
            ],
        ];

        $results = [];

        foreach ($holidays as $h) {
            $results[] = Holiday::updateOrCreate(
                [
                    'name' => $h['name'],
                    'date' => $h['date'],
                ],
                $h
            );
        }

        return $results;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. CẤU HÌNH 3 TRUNG TÂM
    // ─────────────────────────────────────────────────────────────────────────

    private function getCentersConfiguration(): array
    {
        return [
            // Center 1: Cầu Giấy - Hà Nội (Chuyên IELTS)
            [
                'code'              => 'CTR000000001',
                'name'              => 'Trung tâm Ngoại ngữ Sam - Cầu Giấy (Hà Nội)',
                'phone'             => '024.3333.8888',
                'email'             => 'caugiay@sam-edu.vn',
                'address'           => '100 Phố Cầu Giấy, Q. Cầu Giấy, Hà Nội',
                'subscription_plan' => 'pro',
                'plan_name'         => 'Gói Chuyên Nghiệp (Pro)',
                'max_students'      => 500,
                'max_classes'       => 40,
                'admin'             => [
                    'username'   => 'admin_caugiay',
                    'email'      => 'admin.caugiay@sam-edu.vn',
                    'admin_code' => 'ADM000000001',
                    'full_name'  => 'Trần Văn Quản Trị (Cầu Giấy)',
                    'phone'      => '0901000001',
                ],
                'rooms' => [
                    ['code' => 'R000000001', 'name' => 'Phòng Lab 101 (IELTS Speaking)', 'capacity' => 25],
                    ['code' => 'R000000002', 'name' => 'Phòng Hội Thảo 201', 'capacity' => 40],
                    ['code' => 'R000000003', 'name' => 'Phòng Học Thông Minh 301', 'capacity' => 30],
                    ['code' => 'R000000004', 'name' => 'Phòng Đa Năng 401', 'capacity' => 25],
                ],
                'subjects' => [
                    ['code' => 'S000000001', 'name' => 'IELTS Foundation 4.5 - 5.5', 'fee' => 3500000, 'sessions' => 24, 'duration' => 90],
                    ['code' => 'S000000002', 'name' => 'IELTS Intensive 6.5+ 4 Kỹ Năng', 'fee' => 5500000, 'sessions' => 36, 'duration' => 90],
                    ['code' => 'S000000003', 'name' => 'Tiếng Anh Giao Tiếp Phản Xạ', 'fee' => 2800000, 'sessions' => 20, 'duration' => 75],
                    ['code' => 'S000000004', 'name' => 'Tiếng Anh Thiếu Nhi Starters/Movers', 'fee' => 2200000, 'sessions' => 16, 'duration' => 60],
                ],
                'teacher_prefix' => 'gv_cg',
                'student_prefix' => 'hs_cg',
                'class_prefix'   => 'IELTS_HN',
            ],

            // Center 2: Quận 1 - TP.HCM (Chuyên TOEIC & Business English)
            [
                'code'              => 'CTR000000002',
                'name'              => 'Trung tâm Anh ngữ Sam - Quận 1 (TP.HCM)',
                'phone'             => '028.3333.9999',
                'email'             => 'quan1@sam-edu.vn',
                'address'           => '123 Đường Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM',
                'subscription_plan' => 'pro',
                'plan_name'         => 'Gói Chuyên Nghiệp (Pro)',
                'max_students'      => 500,
                'max_classes'       => 40,
                'admin'             => [
                    'username'   => 'admin_quan1',
                    'email'      => 'admin.quan1@sam-edu.vn',
                    'admin_code' => 'ADM000000002',
                    'full_name'  => 'Lê Hoàng Quản Trị (Quận 1)',
                    'phone'      => '0901000002',
                ],
                'rooms' => [
                    ['code' => 'R000000005', 'name' => 'Phòng TOEIC Master 101', 'capacity' => 35],
                    ['code' => 'R000000006', 'name' => 'Phòng Business Talk 202', 'capacity' => 25],
                    ['code' => 'R000000007', 'name' => 'Phòng Khảo Thí Quốc Tế 303', 'capacity' => 45],
                ],
                'subjects' => [
                    ['code' => 'S000000005', 'name' => 'TOEIC Cấp Tốc 650+ Listening & Reading', 'fee' => 3200000, 'sessions' => 24, 'duration' => 90],
                    ['code' => 'S000000006', 'name' => 'TOEIC 4 Kỹ Năng Chuẩn ETS', 'fee' => 4200000, 'sessions' => 30, 'duration' => 90],
                    ['code' => 'S000000007', 'name' => 'Tiếng Anh Doanh Nghiệp & Đàm Phán', 'fee' => 4800000, 'sessions' => 20, 'duration' => 75],
                ],
                'teacher_prefix' => 'gv_q1',
                'student_prefix' => 'hs_q1',
                'class_prefix'   => 'TOEIC_HCM',
            ],

            // Center 3: Đà Nẵng (Chuyên Tiếng Trung HSK)
            [
                'code'              => 'CTR000000003',
                'name'              => 'Trung tâm Hoa ngữ Sam - Hải Châu (Đà Nẵng)',
                'phone'             => '0236.333.7777',
                'email'             => 'danang@sam-edu.vn',
                'address'           => '456 Đường Lê Duẩn, Q. Hải Châu, TP. Đà Nẵng',
                'subscription_plan' => 'standard',
                'plan_name'         => 'Gói Tiêu Chuẩn (Standard)',
                'max_students'      => 200,
                'max_classes'       => 15,
                'admin'             => [
                    'username'   => 'admin_danang',
                    'email'      => 'admin.danang@sam-edu.vn',
                    'admin_code' => 'ADM000000003',
                    'full_name'  => 'Phạm Minh Quản Trị (Đà Nẵng)',
                    'phone'      => '0901000003',
                ],
                'rooms' => [
                    ['code' => 'R000000008', 'name' => 'Phòng Hán Ngữ Sơ Cấp 101', 'capacity' => 25],
                    ['code' => 'R000000009', 'name' => 'Phòng Văn Hóa & Thư Pháp 201', 'capacity' => 30],
                ],
                'subjects' => [
                    ['code' => 'S000000008', 'name' => 'Tiếng Trung Sơ Cấp HSK 1 - HSK 2', 'fee' => 2500000, 'sessions' => 20, 'duration' => 75],
                    ['code' => 'S000000009', 'name' => 'Tiếng Trung Trung Cấp HSK 3 - HSK 4', 'fee' => 3800000, 'sessions' => 30, 'duration' => 90],
                    ['code' => 'S000000010', 'name' => 'Tiếng Trung Thương Mại Giao Tiếp', 'fee' => 4500000, 'sessions' => 24, 'duration' => 90],
                ],
                'teacher_prefix' => 'gv_dn',
                'student_prefix' => 'hs_dn',
                'class_prefix'   => 'HSK_DN',
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. SEED TOÀN BỘ 1 TRUNG TÂM
    // ─────────────────────────────────────────────────────────────────────────

    private function seedCenterComplete(array $config, array $nationalHolidays, Admin $superAdmin): Center
    {
        // A. Tạo Trung Tâm
        $center = Center::updateOrCreate(
            ['code' => $config['code']],
            [
                'name'              => $config['name'],
                'phone'             => $config['phone'],
                'email'             => $config['email'],
                'address'           => $config['address'],
                'status'            => 'active',
                'subscription_plan' => $config['subscription_plan'],
                'expires_at'        => Carbon::now()->addYear(),
                'max_students'      => $config['max_students'],
                'max_classes'       => $config['max_classes'],
            ]
        );

        // B. Tạo Admin phụ & gán phân công
        $subAdmin = Admin::updateOrCreate(
            ['username' => $config['admin']['username']],
            [
                'admin_code' => $config['admin']['admin_code'],
                'username'   => $config['admin']['username'],
                'email'      => $config['admin']['email'],
                'password'   => Hash::make('password'),
                'full_name'  => $config['admin']['full_name'],
                'phone'      => $config['admin']['phone'],
                'role'       => 'admin',
                'status'     => 'active',
            ]
        );
        $subAdmin->centers()->sync([$center->id]);

        // C. Tạo Lịch sử gói dịch vụ (center_subscriptions)
        DB::table('center_subscriptions')->insert([
            'center_id'     => $center->id,
            'plan_code'     => $config['subscription_plan'],
            'plan_name'     => $config['plan_name'],
            'price'         => $config['subscription_plan'] === 'pro' ? 8640000 : 4800000,
            'duration_days' => 365,
            'starts_at'     => Carbon::now()->subMonths(2)->toDateTimeString(),
            'ends_at'       => Carbon::now()->addMonths(10)->toDateTimeString(),
            'status'        => 'active',
            'created_at'    => $this->now,
            'updated_at'    => $this->now,
        ]);

        // D. Tạo ExamTypes cho Trung tâm
        $examTypes = $this->createExamTypesForCenter($center);

        // E. Tạo Phòng học & Thiết bị
        $rooms = $this->createRoomsForCenter($center, $config['rooms']);

        // F. Tạo Môn học
        $subjects = $this->createSubjectsForCenter($center, $config['subjects']);

        // G. Tạo Giáo viên
        $teachers = $this->createTeachersForCenter($center, $config['teacher_prefix']);

        // H. Tạo Học sinh
        $students = $this->createStudentsForCenter($center, $config['student_prefix']);

        // I. Tạo Lớp học, Lịch học, Ca học, Điểm danh, Chat
        $classes = $this->createClassesAndSchedules(
            $center,
            $subjects,
            $teachers,
            $rooms,
            $students,
            $config['class_prefix'],
            $nationalHolidays
        );

        // J. Tạo Ngân hàng Đề thi, Đề thi Lớp, Bài nộp, Chấm điểm
        $this->createExamsAndSubmissions(
            $center,
            $subjects,
            $teachers,
            $classes,
            $students,
            $examTypes,
            $subAdmin
        );

        // K. Tạo Khoản thu học phí & Lịch sử đóng tiền
        $this->createTuitionsAndPayments($center, $classes, $students, $subAdmin);

        // L. Ghi chú, Tài liệu học tập
        $this->createStudentNotesAndDocs($center, $teachers, $students, $subAdmin);

        return $center;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXAM TYPES CHO TRUNG TÂM
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array<string, ExamType>
     * @param  Center                  $center
     */
    private function createExamTypesForCenter(Center $center): array
    {
        $templates = ExamTypeSeeder::getDefaultExamTypes();
        $results   = [];

        foreach ($templates as $t) {
            $examType = ExamType::updateOrCreate(
                [
                    'center_id' => $center->id,
                    'code'      => $t['code'],
                ],
                [
                    'name'        => $t['name'],
                    'description' => $t['description'],
                    'status'      => $t['status'],
                ]
            );
            $results[$t['code']] = $examType;
        }

        return $results;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHÒNG HỌC & THIẾT BỊ
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array<int, Room>
     * @param  Center           $center
     * @param  array            $roomsData
     */
    private function createRoomsForCenter(Center $center, array $roomsData): array
    {
        $rooms = [];

        foreach ($roomsData as $r) {
            $room = Room::updateOrCreate(
                [
                    'center_id' => $center->id,
                    'name'      => $r['name'],
                ],
                [
                    'code'     => $r['code'],
                    'capacity' => $r['capacity'],
                    'status'   => 'active',
                ]
            );

            // Gắn trang thiết bị phòng
            DB::table('room_equipments')->updateOrInsert(
                ['room_id' => $room->id, 'name' => 'Máy chiếu Laser 4K Full HD'],
                ['quantity' => 1, 'status' => 'good', 'updated_at' => $this->now]
            );
            DB::table('room_equipments')->updateOrInsert(
                ['room_id' => $room->id, 'name' => 'Hệ thống Loa Bluetooth Audio Test'],
                ['quantity' => 2, 'status' => 'good', 'updated_at' => $this->now]
            );
            DB::table('room_equipments')->updateOrInsert(
                ['room_id' => $room->id, 'name' => 'Điều hòa 2 chiều Inverter 24000BTU'],
                ['quantity' => 2, 'status' => 'good', 'updated_at' => $this->now]
            );

            $rooms[] = $room;
        }

        return $rooms;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MÔN HỌC
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array<int, Subject>
     * @param  Center              $center
     * @param  array               $subjectsData
     */
    private function createSubjectsForCenter(Center $center, array $subjectsData): array
    {
        $subjects = [];

        foreach ($subjectsData as $s) {
            $subject = Subject::updateOrCreate(
                [
                    'center_id' => $center->id,
                    'name'      => $s['name'],
                ],
                [
                    'code'             => $s['code'],
                    'tuition_fee'      => $s['fee'],
                    'total_sessions'   => $s['sessions'],
                    'duration_minutes' => $s['duration'],
                    'description'      => "Chương trình đào tạo chuẩn hóa môn {$s['name']} với giảng viên chất lượng cao.",
                    'status'           => 'active',
                ]
            );
            $subjects[] = $subject;
        }

        return $subjects;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GIÁO VIÊN
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array<int, Teacher>
     * @param  Center              $center
     * @param  string              $prefix
     */
    private function createTeachersForCenter(Center $center, string $prefix): array
    {
        $teacherNames = [
            ['Hoàng Minh', 'Quân', 'Thạc sĩ Ngôn ngữ học Anh, IELTS 8.5'],
            ['Nguyễn Thị Mai', 'Anh', 'Cử nhân Sư phạm Tiếng Anh, TESOL Quốc tế'],
            ['Đặng Tuấn', 'Kiệt', 'Chuyên gia Luyện thi IELTS 8.0 & TOEIC 990'],
            ['Vũ Bích', 'Phương', 'Thạc sĩ Đại học Ngoại ngữ Bắc Kinh, HSK 6'],
        ];

        $teachers = [];

        foreach ($teacherNames as $idx => [$fn, $ln, $spec]) {
            $num      = $idx + 1;
            $username = "{$prefix}_{$num}";
            $code     = sprintf('T%09d', ($center->id * 100) + $num);
            $fullName = "{$fn} {$ln}";

            $teacher = Teacher::updateOrCreate(
                ['username' => $username],
                [
                    'teacher_code'   => $code,
                    'center_id'      => $center->id,
                    'first_name'     => $fn,
                    'last_name'      => $ln,
                    'full_name'      => $fullName,
                    'email'          => "{$username}@sam-edu.vn",
                    'phone'          => '0912' . sprintf('%06d', ($center->id * 1000) + $num),
                    'password'       => Hash::make('password'),
                    'specialization' => $spec,
                    'hire_date'      => Carbon::now()->subMonths(12)->toDateString(),
                    'status'         => 'active',
                ]
            );
            $teachers[] = $teacher;
        }

        return $teachers;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HỌC SINH (KÈM THÔNG TIN PHỤ HUYNH)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array<int, Student>
     * @param  Center              $center
     * @param  string              $prefix
     */
    private function createStudentsForCenter(Center $center, string $prefix): array
    {
        $firstNames  = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ'];
        $middleNames = ['Văn', 'Thị', 'Đức', 'Hải', 'Quang', 'Minh', 'Ngọc', 'Thu', 'Hữu', 'Bảo', 'Gia', 'Khánh'];
        $lastNames   = ['Nam', 'An', 'Bình', 'Cường', 'Dương', 'Hà', 'Huy', 'Khoa', 'Linh', 'Long', 'My', 'Phong', 'Trang', 'Tú', 'Uyên', 'Vy', 'Đạt', 'Dũng'];

        $relationships = ['Bố', 'Mẹ', 'Người giám hộ'];

        $students      = [];
        $totalStudents = 18; // 18 học sinh cho mỗi trung tâm

        for ($i = 1; $i <= $totalStudents; $i++) {
            $fn       = $firstNames[($i + $center->id) % count($firstNames)] . ' ' . $middleNames[($i * 2 + $center->id) % count($middleNames)];
            $ln       = $lastNames[($i * 3 + $center->id) % count($lastNames)];
            $fullName = "{$fn} {$ln}";

            $username = "{$prefix}_" . sprintf('%02d', $i);
            $code     = sprintf('STD%09d', ($center->id * 1000) + $i);
            $gender   = $i % 2 === 0 ? 'female' : 'male';
            $dob      = Carbon::now()->subYears(15 + ($i % 6))->subDays($i * 12)->toDateString();

            $parentName  = 'Phụ huynh ' . ($gender === 'female' ? 'Mẹ em ' : 'Bố em ') . $ln;
            $parentPhone = '098' . sprintf('%07d', ($center->id * 100000) + $i);
            $parentRel   = $relationships[$i % count($relationships)];

            $student = Student::updateOrCreate(
                ['username' => $username],
                [
                    'student_code'        => $code,
                    'center_id'           => $center->id,
                    'first_name'          => $fn,
                    'last_name'           => $ln,
                    'full_name'           => $fullName,
                    'email'               => "{$username}@student.sam-edu.vn",
                    'phone'               => '097' . sprintf('%07d', ($center->id * 100000) + $i),
                    'password'            => Hash::make('password'),
                    'date_of_birth'       => $dob,
                    'gender'              => $gender,
                    'address'             => 'Số ' . ($i * 12) . " Đường số {$i}, " . $center->name,
                    'parent_name'         => $parentName,
                    'parent_phone'        => $parentPhone,
                    'parent_relationship' => $parentRel,
                    'admission_date'      => Carbon::now()->subMonths(3)->toDateString(),
                    'status'              => 1, // 1 = Đang học (tinyint)
                ]
            );
            $students[] = $student;
        }

        return $students;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LỚP HỌC, LỊCH HỌC, CA HỌC, ĐIỂM DANH, CHAT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @param  array<int, Subject>     $subjects
     * @param  array<int, Teacher>     $teachers
     * @param  array<int, Room>        $rooms
     * @param  array<int, Student>     $students
     * @param  Center                  $center
     * @param  string                  $classPrefix
     * @param  array                   $nationalHolidays
     * @return array<int, SchoolClass>
     */
    private function createClassesAndSchedules(
        Center $center,
        array $subjects,
        array $teachers,
        array $rooms,
        array $students,
        string $classPrefix,
        array $nationalHolidays
    ): array {
        $classes    = [];
        $holidayIds = array_map(fn ($h) => $h->id, $nationalHolidays);

        foreach ($subjects as $idx => $subject) {
            $teacher   = $teachers[$idx % count($teachers)];
            $room      = $rooms[$idx % count($rooms)];
            $classNum  = $idx + 1;
            $classCode = sprintf('C%09d', ($center->id * 100) + $classNum);
            $className = "Lớp {$subject->name} - K{$classNum} ({$classPrefix})";

            $startDate = Carbon::now()->subWeeks(4)->startOfWeek();
            $endDate   = (clone $startDate)->addWeeks(12)->endOfWeek();

            // 1. Tạo Lớp học (status = 1: Đang học)
            $schoolClass = SchoolClass::updateOrCreate(
                ['code' => $classCode],
                [
                    'center_id'    => $center->id,
                    'name'         => $className,
                    'max_students' => 25,
                    'start_date'   => $startDate->toDateString(),
                    'end_date'     => $endDate->toDateString(),
                    'status'       => 1, // 1 = active (tinyint)
                ]
            );

            // 2. Ghi danh học sinh vào lớp (10-12 học sinh mỗi lớp)
            $enrolledStudents = array_slice($students, ($idx * 4) % count($students), 10);

            foreach ($enrolledStudents as $std) {
                DB::table('class_students')->updateOrInsert(
                    [
                        'class_id'   => $schoolClass->id,
                        'student_id' => $std->id,
                    ],
                    [
                        'enrolled_at' => $startDate->toDateTimeString(),
                        'status'      => 'active',
                        'created_at'  => $this->now,
                        'updated_at'  => $this->now,
                    ]
                );
            }

            // 3. Liên kết môn học & giáo viên (class_subjects)
            $classSubjectId = DB::table('class_subjects')->insertGetId([
                'class_id'   => $schoolClass->id,
                'subject_id' => $subject->id,
                'teacher_id' => $teacher->id,
                'start_date' => $startDate->toDateString(),
                'end_date'   => $endDate->toDateString(),
                'created_at' => $this->now,
                'updated_at' => $this->now,
            ]);

            // 4. Lịch học cố định hàng tuần (2-4-6 hoặc 3-5-7)
            $daysOfWeek = $idx % 2 === 0 ? [1, 3, 5] : [2, 4, 6]; // 1: Thứ 2, 3: Thứ 4...
            $startTime  = $idx % 2 === 0 ? '18:00' : '19:45';
            $endTime    = $idx % 2 === 0 ? '19:30' : '21:15';

            $weeksJson = [];

            foreach ($daysOfWeek as $dow) {
                $weeksJson[(string) $dow] = [
                    [
                        $startTime,
                        $endTime,
                    ],
                ];
            }

            $classScheduleId = DB::table('class_schedules')->insertGetId([
                'class_subject_id'     => $classSubjectId,
                'weeks'                => json_encode($weeksJson),
                'off_days'             => json_encode([]),
                'extra_days'           => json_encode([]),
                'room_id'              => $room->id,
                'excluded_holiday_ids' => json_encode($holidayIds),
                'created_at'           => $this->now,
                'updated_at'           => $this->now,
            ]);

            // 5. Sinh chuỗi Ca học thực tế (12 buổi đã qua, 12 buổi sắp tới)
            $currentDate  = clone $startDate;
            $sessionCount = 0;
            $maxSessions  = 24;

            while ($currentDate->lte($endDate) && $sessionCount < $maxSessions) {
                $dow = $currentDate->dayOfWeekIso - 1; // 0 = Thứ 2, 1 = Thứ 3, ...

                if (in_array($dow, $daysOfWeek, true)) {
                    $sessionCount++;
                    $isPast        = $currentDate->lt(Carbon::now());
                    $sessionStatus = $isPast ? 'completed' : 'scheduled';

                    $sessionId = DB::table('class_sessions')->insertGetId([
                        'class_subject_id'  => $classSubjectId,
                        'class_schedule_id' => $classScheduleId,
                        'teacher_id'        => $teacher->id,
                        'room_id'           => $room->id,
                        'session_date'      => $currentDate->toDateString(),
                        'start_time'        => "{$startTime}:00",
                        'end_time'          => "{$endTime}:00",
                        'status'            => $sessionStatus,
                        'topic'             => "Bài học số {$sessionCount}: Phát triển kỹ năng {$subject->name}",
                        'created_at'        => $this->now,
                        'updated_at'        => $this->now,
                    ]);

                    // Nếu ca học đã hoàn thành -> Điểm danh cho học sinh
                    if ($isPast) {
                        foreach ($enrolledStudents as $sIdx => $std) {
                            $attStatus = 'present';
                            $attNote   = 'Tham gia đầy đủ, làm bài tốt.';

                            if ($sIdx % 7 === 0) {
                                $attStatus = 'late';
                                $attNote   = 'Đến muộn 10 phút vì kẹt xe.';
                            } elseif ($sIdx % 9 === 0) {
                                $attStatus = 'absent';
                                $attNote   = 'Nghỉ học có phép (báo trước).';
                            }

                            DB::table('attendances')->insert([
                                'session_id'           => $sessionId,
                                'student_id'           => $std->id,
                                'status'               => $attStatus,
                                'note'                 => $attNote,
                                'marked_by_teacher_id' => $teacher->id,
                                'marked_at'            => $currentDate->toDateTimeString(),
                                'created_at'           => $this->now,
                                'updated_at'           => $this->now,
                            ]);
                        }
                    }
                }

                $currentDate->addDay();
            }

            // 6. Tin nhắn trao đổi lớp học (Class Chat)
            $messages = [
                ['teacher', $teacher->id, $teacher->full_name, 'Chào mừng tất cả các em đến với khóa học ' . $subject->name . '! Thầy/Cô sẽ đồng hành cùng các bạn trong suốt 3 tháng tới.', true],
                ['teacher', $teacher->id, $teacher->full_name, 'Mọi người nhớ chuẩn bị đầy đủ tài liệu và làm bài tập về nhà trước buổi học nhé.', false],
                ['student', $enrolledStudents[0]->id, $enrolledStudents[0]->full_name, 'Dạ em chào Thầy/Cô và các bạn ạ!', false],
                ['student', $enrolledStudents[1]->id, $enrolledStudents[1]->full_name, 'Thầy/Cô cho em hỏi bài tập buổi 2 nộp hạn chót vào lúc nào ạ?', false],
                ['teacher', $teacher->id, $teacher->full_name, 'Hạn nộp bài tập là trước 12:00 trưa ngày mai em nhé!', false],
            ];

            foreach ($messages as [$senderType, $senderId, $senderName, $msg, $isPinned]) {
                DB::table('class_chat_messages')->insert([
                    'class_id'       => $schoolClass->id,
                    'sender_type'    => $senderType,
                    'sender_id'      => $senderId,
                    'sender_name'    => $senderName,
                    'message'        => $msg,
                    'is_pinned'      => $isPinned,
                    'pinned_at'      => $isPinned ? $this->now : null,
                    'pinned_by_name' => $isPinned ? $teacher->full_name : null,
                    'created_at'     => $this->now,
                    'updated_at'     => $this->now,
                ]);
            }

            $classes[] = $schoolClass;
        }

        return $classes;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NGÂN HÀNG ĐỀ THI, ĐỀ THI LỚP, BÀI NỘP, CHẤM ĐIỂM
    // ─────────────────────────────────────────────────────────────────────────

    private function createExamsAndSubmissions(
        Center $center,
        array $subjects,
        array $teachers,
        array $classes,
        array $students,
        array $examTypes,
        Admin $subAdmin
    ): void {
        $generalType = $examTypes['general'] ?? ExamType::first();
        $ieltsType   = $examTypes['ielts'] ?? $generalType;

        // 1. Tạo Đề Thi Thử Mẫu (Practice Exam 4 Kỹ Năng)
        $practiceExam = Exam::updateOrCreate(
            ['code' => sprintf('EX%09d', ($center->id * 100) + 1)],
            [
                'center_id'         => $center->id,
                'subject_id'        => $subjects[0]->id,
                'exam_type_id'      => $ieltsType->id,
                'name'              => "Đề Thi Thử Chuẩn Hóa Quốc Tế Test 01 - {$center->name}",
                'duration_minutes'  => 60,
                'max_score'         => 30,
                'pass_score'        => 15,
                'shuffle_questions' => false,
                'shuffle_options'   => true,
                'max_attempts'      => 3,
                'is_practice'       => true,
                'status'            => 'published',
                'description'       => 'Bộ đề thi thử đánh giá toàn diện năng lực ngôn ngữ với đa dạng các phần thi kỹ năng đọc, nghe, viết và trắc nghiệm.',
            ]
        );

        $this->createRichExamSectionsAndQuestions($practiceExam);

        // 2. Tạo Đề Kiểm Tra Giữa Kỳ Cho Lớp
        $midtermExam = Exam::updateOrCreate(
            ['code' => sprintf('EX%09d', ($center->id * 100) + 2)],
            [
                'center_id'         => $center->id,
                'subject_id'        => $subjects[0]->id,
                'exam_type_id'      => $examTypes['midterm']->id ?? $generalType->id,
                'name'              => "Bài Kiểm Tra Giữa Kỳ - {$classes[0]->name}",
                'duration_minutes'  => 45,
                'max_score'         => 10,
                'pass_score'        => 5,
                'shuffle_questions' => true,
                'shuffle_options'   => true,
                'max_attempts'      => 1,
                'is_practice'       => false,
                'status'            => 'published',
                'description'       => 'Bài thi kiểm tra giữa kỳ bắt buộc cho học sinh trong lớp.',
            ]
        );

        $this->createRichExamSectionsAndQuestions($midtermExam);

        // 3. Gán bài thi vào lớp học (class_exams)
        $classExamId = DB::table('class_exams')->insertGetId([
            'class_id'            => $classes[0]->id,
            'exam_id'             => $midtermExam->id,
            'title'               => 'Kiểm Tra Giữa Kỳ Học Phần 1',
            'exam_date'           => Carbon::now()->subDays(2)->toDateString(),
            'start_time'          => '18:00:00',
            'end_time'            => '18:45:00',
            'duration_minutes'    => 45,
            'max_score'           => 10,
            'pass_score'          => 5,
            'access_code'         => 'SAM' . sprintf('%04d', $classes[0]->id),
            'status'              => 'completed',
            'created_by_admin_id' => $subAdmin->id,
            'created_at'          => $this->now,
            'updated_at'          => $this->now,
        ]);

        // 4. Sinh bài nộp của học sinh (class_exam_submissions) và bảng điểm (exam_results)
        $enrolled = DB::table('class_students')->where('class_id', $classes[0]->id)->pluck('student_id')->toArray();

        foreach ($enrolled as $sIdx => $studentId) {
            $score = round(6.5 + (($sIdx * 0.4) % 3.5), 1); // Điểm từ 6.5 -> 9.5
            $grade = $score >= 8.5 ? 'Giỏi' : ($score >= 7.0 ? 'Khá' : 'Trung Bình');

            DB::table('class_exam_submissions')->insert([
                'class_exam_id'         => $classExamId,
                'student_id'            => $studentId,
                'attempt_number'        => 1,
                'started_at'            => Carbon::now()->subDays(2)->toDateTimeString(),
                'submitted_at'          => Carbon::now()->subDays(2)->addMinutes(40)->toDateTimeString(),
                'duration_seconds_used' => 2400,
                'score'                 => $score,
                'total_correct'         => 8,
                'total_questions'       => 10,
                'status'                => 'submitted',
                'is_graded'             => true,
                'graded_at'             => Carbon::now()->subDays(1)->toDateTimeString(),
                'graded_by_teacher_id'  => $teachers[0]->id,
                'answers'               => json_encode(['answers' => ['Q01_SINGLE' => 'B', 'Q02_MULTI' => ['A', 'C'], 'Q03_BLANK' => ['insisted', 'deadline']]]),
                'teacher_feedback'      => "Học sinh làm bài cẩn thận, ngữ pháp chuẩn xác. Đạt điểm {$score}.",
                'created_at'            => $this->now,
                'updated_at'            => $this->now,
            ]);

            $resultId = DB::table('exam_results')->insertGetId([
                'exam_id'               => $midtermExam->id,
                'student_id'            => $studentId,
                'score'                 => $score,
                'grade'                 => $grade,
                'comment'               => 'Điểm thi giữa kỳ đã được giáo viên công nhận.',
                'entered_by_teacher_id' => $teachers[0]->id,
                'entered_at'            => Carbon::now()->subDays(1)->toDateTimeString(),
                'created_at'            => $this->now,
                'updated_at'            => $this->now,
            ]);

            // Lịch sử sửa điểm mẫu cho 1 bạn
            if ($sIdx === 0) {
                DB::table('exam_result_histories')->insert([
                    'exam_result_id'      => $resultId,
                    'old_score'           => 7.5,
                    'new_score'           => 8.5,
                    'reason'              => 'Cộng điểm thưởng phát biểu tích cực trong giờ học.',
                    'changed_by_admin_id' => $subAdmin->id,
                    'created_at'          => $this->now,
                ]);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TẠO CÁC CÂU HỎI ĐẦY ĐỦ CÂU TRẢ LỜI CHO ĐỀ THI
    // (Đầy đủ đáp án cho tất cả câu hỏi, trừ câu hỏi Speaking và Writing)
    // ─────────────────────────────────────────────────────────────────────────

    private function createRichExamSectionsAndQuestions(Exam $exam): void
    {
        // ── Section 1: Đọc Hiểu & Từ Vựng (Reading) ──
        $secReading = ExamSection::create([
            'exam_id'     => $exam->id,
            'title'       => 'Phần 1: Kỹ Năng Đọc Hiểu & Ngữ Pháp (Reading Comprehension)',
            'description' => 'Đọc kỹ các đoạn trích và hoàn thành câu hỏi từ câu 1 đến câu 6.',
            'skill'       => 'reading',
            'order_index' => 0,
        ]);

        // 1. Single Choice (Có đáp án đầy đủ: 'B')
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secReading->id,
            'code'          => 'Q01_SINGLE',
            'title'         => 'Mục tiêu của chương trình chìm trong môi trường ngôn ngữ (Language Immersion)',
            'question_type' => 'single_choice',
            'skill'         => 'reading',
            'content'       => 'What is the primary objective of language immersion programs in modern education?',
            'score'         => 2.0,
            'options'       => [
                ['key' => 'A', 'text' => 'To memorize grammatical rules systematically through rote learning'],
                ['key' => 'B', 'text' => 'To provide authentic communicative context and natural language acquisition'],
                ['key' => 'C', 'text' => 'To translate classical literary texts word-by-word into native language'],
                ['key' => 'D', 'text' => 'To prepare students exclusively for multiple-choice standardized tests'],
            ],
            'correct_answer' => 'B',
            'explanation'    => 'Language immersion provides authentic communicative context facilitating natural language acquisition.',
        ]);

        // 2. Multiple Choice (Có đáp án đầy đủ: ['A', 'C'])
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secReading->id,
            'code'          => 'Q02_MULTI',
            'title'         => 'Chiến lược tăng tốc độ đọc hiểu văn bản (Speed Reading Strategies)',
            'question_type' => 'multiple_choice',
            'skill'         => 'reading',
            'content'       => 'Which of the following strategies are proven to enhance reading speed without sacrificing comprehension? (Choose 2 answers)',
            'score'         => 2.0,
            'options'       => [
                ['key' => 'A', 'text' => 'Minimizing sub-vocalization (saying words in your head)'],
                ['key' => 'B', 'text' => 'Reading every individual word letter-by-letter repeatedly'],
                ['key' => 'C', 'text' => 'Expanding peripheral vision to capture word chunks and phrase groups'],
                ['key' => 'D', 'text' => 'Translating each English word into native language immediately'],
            ],
            'correct_answer' => ['A', 'C'],
            'explanation'    => 'Minimizing sub-vocalization and expanding peripheral vision to read in chunks significantly increase reading speed and comprehension.',
        ]);

        // 3. True / False / Not Given (Có đáp án đầy đủ: 'TRUE')
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secReading->id,
            'code'          => 'Q03_TFNG',
            'title'         => 'Phương pháp lặp lại ngắt quãng trong học tập (Spaced Repetition Method)',
            'question_type' => 'true_false_not_given',
            'skill'         => 'reading',
            'content'       => 'According to the research passage, consistent daily exposure of 30 minutes yields higher retention rates than cramming for 5 hours once a week.',
            'score'         => 2.0,
            'options'       => [
                ['key' => 'TRUE', 'text' => 'True (Đúng theo nội dung bài)'],
                ['key' => 'FALSE', 'text' => 'False (Sai so với nội dung bài)'],
                ['key' => 'NOT_GIVEN', 'text' => 'Not Given (Thông tin không được đề cập)'],
            ],
            'correct_answer' => 'TRUE',
            'explanation'    => 'Spaced repetition (30 mins daily) is confirmed in pedagogical studies to yield superior long-term memory retention.',
        ]);

        // 4. Fill in the Blank (Có đáp án đầy đủ: ['insisted', 'deadline'])
        ExamQuestion::create([
            'exam_id'        => $exam->id,
            'section_id'     => $secReading->id,
            'code'           => 'Q04_BLANK',
            'title'          => 'Hoàn thành đoạn văn về tiến độ dự án nghiên cứu (Research Team Completion)',
            'question_type'  => 'fill_in_blank',
            'skill'          => 'reading',
            'content'        => 'Despite facing unexpected obstacles, the research team [insisted] on completing their comprehensive survey before the final [deadline].',
            'score'          => 2.0,
            'options'        => null,
            'correct_answer' => ['insisted', 'deadline'],
            'explanation'    => 'Các từ cần điền chính xác theo ngữ cảnh câu: insisted, deadline.',
        ]);

        // 5. Find Mistake (Có đáp án đầy đủ: 'D')
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secReading->id,
            'code'          => 'Q05_MISTAKE',
            'title'         => 'Tìm và phát hiện lỗi sai ngữ pháp trong câu (Grammar Error Identification)',
            'question_type' => 'find_mistake',
            'skill'         => 'reading',
            'content'       => 'She does not know how to explain the complex situation clearly to he.',
            'score'         => 2.0,
            'options'       => [
                'sentence_segments' => [
                    ['text' => 'She ', 'underlined' => false],
                    ['text' => 'does not', 'underlined' => true, 'id' => 'A'],
                    ['text' => ' know how ', 'underlined' => false],
                    ['text' => 'to explain', 'underlined' => true, 'id' => 'B'],
                    ['text' => ' the complex situation ', 'underlined' => false],
                    ['text' => 'clearly', 'underlined' => true, 'id' => 'C'],
                    ['text' => ' to ', 'underlined' => false],
                    ['text' => 'he', 'underlined' => true, 'id' => 'D'],
                    ['text' => '.', 'underlined' => false],
                ],
            ],
            'correct_answer' => 'D',
            'explanation'    => 'Lỗi ở phương án D: Giới từ "to" phải đi kèm đại từ tân ngữ "him" thay vì đại từ nhân xưng chủ ngữ "he".',
        ]);

        // 6. Matching Image (Có đáp án đầy đủ: ['1' => 'A', '2' => 'B', '3' => 'C'])
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secReading->id,
            'code'          => 'Q06_MATCH_IMG',
            'title'         => 'Ghép nối các hoạt động học tập với hình ảnh minh họa (Study Activities Pairing)',
            'question_type' => 'matching_image',
            'skill'         => 'reading',
            'content'       => 'Quan sát các bức ảnh minh họa và ghép nối từng hoạt động học tập với bức hình tương ứng:',
            'score'         => 3.0,
            'options'       => [
                'sentences' => [
                    ['id' => '1', 'text' => 'Học viên thảo luận nhóm giải quyết bài tập dự án'],
                    ['id' => '2', 'text' => 'Giáo viên hướng dẫn chỉnh sửa phát âm trực tiếp trên lớp'],
                    ['id' => '3', 'text' => 'Học sinh làm bài thi trắc nghiệm trên hệ thống máy tính'],
                ],
                'images' => [
                    ['id' => 'A', 'label' => 'Hình A', 'image_url' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400'],
                    ['id' => 'B', 'label' => 'Hình B', 'image_url' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400'],
                    ['id' => 'C', 'label' => 'Hình C', 'image_url' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400'],
                ],
            ],
            'correct_answer' => [
                '1' => 'A',
                '2' => 'B',
                '3' => 'C',
            ],
            'explanation' => 'Khớp đúng mô tả hoạt động học tập với hình ảnh tương ứng (1-A, 2-B, 3-C).',
        ]);

        // 6b. Drag & Drop Cloze (Kéo thả từ vào chỗ trống)
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secReading->id,
            'code'          => 'Q06B_DRAG_CLOZE',
            'title'         => 'Kéo thả từ vào chỗ trống trong đoạn văn về Di sản Thiên nhiên Vịnh Hạ Long',
            'question_type' => 'drag_drop_cloze',
            'skill'         => 'reading',
            'content'       => 'Ha Long Bay is a famous tourist [blank_1] in Quang Ninh province, Vietnam. It features thousands of limestone [blank_2] in various shapes and sizes. Visitors from all over the world come to admire this magnificent natural [blank_3].',
            'score'         => 3.0,
            'options'       => [
                'words' => [
                    ['id' => 'w1', 'text' => 'destination'],
                    ['id' => 'w2', 'text' => 'islands'],
                    ['id' => 'w3', 'text' => 'wonder'],
                    ['id' => 'w4', 'text' => 'mountain'],
                    ['id' => 'w5', 'text' => 'building'],
                ],
            ],
            'correct_answer' => [
                'blank_1' => 'w1',
                'blank_2' => 'w2',
                'blank_3' => 'w3',
            ],
            'explanation' => 'Vị trí 1 điền destination (điểm đến du lịch), vị trí 2 điền islands (hòn đảo đá vôi), vị trí 3 điền wonder (kỳ quan thiên nhiên).',
        ]);

        // ── Section 2: Nghe Hiểu (Listening) ──
        $secListening = ExamSection::create([
            'exam_id'     => $exam->id,
            'title'       => 'Phần 2: Kỹ Năng Nghe Hiểu (Listening Comprehension)',
            'description' => 'Lắng nghe đoạn băng audio và hoàn thành các câu hỏi nối từ, sắp xếp quy trình và gán nhãn sơ đồ.',
            'skill'       => 'listening',
            'order_index' => 1,
        ]);

        // 7. Matching (Có đáp án đầy đủ)
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secListening->id,
            'code'          => 'Q07_MATCHING',
            'title'         => 'Ghép nối các thuật ngữ ngôn ngữ học với định nghĩa tương ứng (Linguistics Terminology)',
            'question_type' => 'matching',
            'skill'         => 'listening',
            'content'       => 'Ghép các thuật ngữ ngôn ngữ học với định nghĩa chính xác được nêu trong bài nghe:',
            'score'         => 3.0,
            'options'       => [
                'left_items' => [
                    ['id' => '1', 'text' => 'Phonetics (Ngữ âm học)'],
                    ['id' => '2', 'text' => 'Syntax (Cú pháp học)'],
                    ['id' => '3', 'text' => 'Semantics (Ngữ nghĩa học)'],
                    ['id' => '4', 'text' => 'Pragmatics (Ngữ dụng học)'],
                ],
                'right_items' => [
                    ['id' => 'a', 'text' => 'Nghiên cứu về âm thanh lời nói con người'],
                    ['id' => 'b', 'text' => 'Quy tắc kết hợp từ thành câu hoàn chỉnh'],
                    ['id' => 'c', 'text' => 'Nghiên cứu về ngữ nghĩa của từ ngữ và câu'],
                    ['id' => 'd', 'text' => 'Nghiên cứu về ngữ cảnh sử dụng trong giao tiếp thực tế'],
                ],
            ],
            'correct_answer' => [
                '1' => 'a',
                '2' => 'b',
                '3' => 'c',
                '4' => 'd',
            ],
            'explanation' => 'Khớp đúng thuật ngữ: Phonetics (âm thanh), Syntax (cú pháp), Semantics (ngữ nghĩa), Pragmatics (ngữ dụng).',
        ]);

        // 8. Ordering (Có đáp án đầy đủ: ['1', '2', '3', '4'])
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secListening->id,
            'code'          => 'Q08_ORDER',
            'title'         => 'Sắp xếp các bước chuẩn bị bài thuyết trình theo thứ tự logic (Presentation Steps Order)',
            'question_type' => 'ordering',
            'skill'         => 'listening',
            'content'       => 'Sắp xếp 4 bước chuẩn bị bài phát biểu trước đám đông theo đúng thứ tự logic được trình bày trong bài nghe:',
            'score'         => 2.0,
            'options'       => [
                ['id' => '1', 'text' => 'Phân tích chân dung thính giả và xác định mục tiêu bài phát biểu'],
                ['id' => '2', 'text' => 'Xây dựng dàn ý chi tiết với luận điểm chính và bằng chứng thực tế'],
                ['id' => '3', 'text' => 'Luyện tập phát âm, kiểm soát giọng điệu và căn thời gian trình bày'],
                ['id' => '4', 'text' => 'Thực hiện bài thuyết trình tự tin và phản hồi câu hỏi giao lưu'],
            ],
            'correct_answer' => ['1', '2', '3', '4'],
            'explanation'    => 'Trình tự bài thuyết trình chuẩn: Phân tích thính giả -> Xây dựng dàn ý -> Luyện tập -> Trình bày thực tế.',
        ]);

        // 9. Diagram Labelling
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secListening->id,
            'code'          => 'Q09_DIAGRAM',
            'title'         => 'Gán nhãn các vị trí trong sơ đồ thư viện trung tâm (Library Floor Plan)',
            'question_type' => 'diagram_labelling',
            'skill'         => 'listening',
            'content'       => 'Lắng nghe phần hướng dẫn chỉ đường trong tòa nhà và chọn nhãn vị trí tương ứng cho các điểm A, B, C trên sơ đồ:',
            'score'         => 3.0,
            'image_url'     => 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600',
            'options'       => [
                'pins' => [
                    ['id' => 'A', 'label' => 'Khu vực A (Phía Tây)'],
                    ['id' => 'B', 'label' => 'Khu vực B (Trung tâm)'],
                    ['id' => 'C', 'label' => 'Khu vực C (Tầng lửng)'],
                ],
                'labels' => [
                    ['id' => '1', 'text' => 'Khu vực máy tính tra cứu (Digital Hub)'],
                    ['id' => '2', 'text' => 'Phòng tự học yên tĩnh (Silent Study Room)'],
                    ['id' => '3', 'text' => 'Quầy mượn trả tài liệu (Help Desk)'],
                ],
            ],
            'correct_answer' => [
                'A' => '1',
                'B' => '3',
                'C' => '2',
            ],
            'explanation' => 'Theo bản đồ và hướng dẫn: Vị trí A là Digital Hub (1), B là Help Desk (3), C là Silent Study Room (2).',
        ]);

        // ── Section 3: Viết & Nói (Writing & Speaking - Chấm thủ công, không có đáp án tự động) ──
        $secSpeakingWriting = ExamSection::create([
            'exam_id'     => $exam->id,
            'title'       => 'Phần 3: Kỹ Năng Viết & Nói (Writing & Speaking)',
            'description' => 'Phần thi tự luận và ghi âm phát âm trực tiếp (Giáo viên sẽ nghe và chấm điểm thủ công).',
            'skill'       => 'writing',
            'order_index' => 2,
        ]);

        // 10. Essay (Viết - Không có correct_answer, giáo viên chấm tay)
        ExamQuestion::create([
            'exam_id'        => $exam->id,
            'section_id'     => $secSpeakingWriting->id,
            'code'           => 'Q10_ESSAY',
            'title'          => 'Nghị luận về tác động của AI trong giáo dục ngôn ngữ (AI in Language Education)',
            'question_type'  => 'essay',
            'skill'          => 'writing',
            'content'        => 'Many people believe that artificial intelligence will transform education in unprecedented ways. Discuss the potential advantages and disadvantages of integrating AI tutoring systems in language learning. (Write at least 180 words).',
            'score'          => 6.0,
            'options'        => null,
            'correct_answer' => null, // Không có đáp án cố định
            'explanation'    => 'Giáo viên đánh giá bài luận dựa trên 4 tiêu chí: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Accuracy.',
        ]);

        // 11. Audio Record (Nói - Không có correct_answer, giáo viên chấm tay)
        ExamQuestion::create([
            'exam_id'        => $exam->id,
            'section_id'     => $secSpeakingWriting->id,
            'code'           => 'Q11_SPEAKING',
            'title'          => 'Kể về trải nghiệm vượt qua thử thách học ngôn ngữ (Speaking Challenge Experience)',
            'question_type'  => 'audio_record',
            'skill'          => 'speaking',
            'content'        => 'Describe a challenging language learning experience you encountered and how you successfully overcame it. You should speak clearly into your microphone for 1.5 to 2 minutes.',
            'score'          => 6.0,
            'options'        => null,
            'correct_answer' => null, // Không có đáp án cố định
            'explanation'    => 'Giáo viên nghe file ghi âm để chấm điểm: Fluency & Coherence, Pronunciation & Intonation, Lexical Resource, Grammatical Range.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUẢN LÝ HỌC PHÍ & LỊCH SỬ ĐÓNG TIỀN
    // ─────────────────────────────────────────────────────────────────────────

    private function createTuitionsAndPayments(Center $center, array $classes, array $students, Admin $subAdmin): void
    {
        foreach ($classes as $cIdx => $schoolClass) {
            $enrolled = DB::table('class_students')->where('class_id', $schoolClass->id)->pluck('student_id')->toArray();
            $fee      = $schoolClass->subject ? $schoolClass->subject->tuition_fee : 3000000;

            foreach ($enrolled as $sIdx => $studentId) {
                $isFullPaid = $sIdx % 3 === 0;
                $isPartial  = $sIdx % 3 === 1;

                $paidAmount      = $isFullPaid ? $fee : ($isPartial ? $fee / 2 : 0);
                $remainingAmount = $fee - $paidAmount;
                $tuitionStatus   = $isFullPaid ? 'completed' : ($isPartial ? 'partial' : 'pending');

                $tuitionId = DB::table('student_tuitions')->insertGetId([
                    'center_id'        => $center->id,
                    'student_id'       => $studentId,
                    'class_id'         => $schoolClass->id,
                    'title'            => "Học phí khóa học {$schoolClass->name}",
                    'total_amount'     => $fee,
                    'paid_amount'      => $paidAmount,
                    'remaining_amount' => $remainingAmount,
                    'status'           => $tuitionStatus,
                    'due_date'         => Carbon::now()->addDays(10)->toDateString(),
                    'created_by'       => $subAdmin->id,
                    'created_at'       => $this->now,
                    'updated_at'       => $this->now,
                ]);

                // Nếu có đóng tiền -> Tạo bản ghi biên lai trong tuition_payments
                if ($paidAmount > 0) {
                    DB::table('tuition_payments')->insert([
                        'student_tuition_id' => $tuitionId,
                        'amount'             => $paidAmount,
                        'payment_date'       => Carbon::now()->subDays(5)->toDateString(),
                        'payment_method'     => $isFullPaid ? 'bank_transfer' : 'cash',
                        'transaction_code'   => 'TXN' . sprintf('%08d', ($center->id * 10000) + ($cIdx * 100) + $sIdx),
                        'note'               => $isFullPaid ? 'Đóng đủ 100% học phí đầu khóa' : 'Đóng đợt 1 (50%) học phí',
                        'received_by'        => $subAdmin->id,
                        'created_at'         => $this->now,
                        'updated_at'         => $this->now,
                    ]);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GHI CHÚ, TÀI LIỆU HỌC TẬP
    // ─────────────────────────────────────────────────────────────────────────

    private function createStudentNotesAndDocs(Center $center, array $teachers, array $students, Admin $subAdmin): void
    {
        $teacher = $teachers[0];

        foreach (array_slice($students, 0, 5) as $idx => $student) {
            DB::table('student_notes')->insert([
                'student_id'            => $student->id,
                'content'               => "Em {$student->full_name} tiếp thu bài rất nhanh, tích cực tham gia xây dựng bài học trên lớp.",
                'created_by_teacher_id' => $teacher->id,
                'created_by_admin_id'   => null,
                'created_at'            => $this->now,
                'updated_at'            => $this->now,
            ]);

            DB::table('student_documents')->insert([
                'student_id'             => $student->id,
                'document_type'          => 'material',
                'file_name'              => 'Tong_hop_tu_vung_unit_' . ($idx + 1) . '.pdf',
                'file_path'              => 'documents/samples/unit_' . ($idx + 1) . '.pdf',
                'file_size'              => 1024 * (500 + $idx * 100),
                'mime_type'              => 'application/pdf',
                'uploaded_by_teacher_id' => $teacher->id,
                'created_at'             => $this->now,
                'updated_at'             => $this->now,
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // YÊU CẦU TƯ VẤN (CONTACT REQUESTS)
    // ─────────────────────────────────────────────────────────────────────────

    private function createContactRequests(): void
    {
        $this->command->info('  📞 Tạo yêu cầu tư vấn khách hàng...');

        $requests = [
            ['Nguyễn Mai Phương', '0988111222', 'maiphuong@gmail.com', 'Tôi muốn tìm hiểu khóa học IELTS Intensive cho con học lớp 11.'],
            ['Trần Quốc Toản', '0977222333', 'toan.tran@gmail.com', 'Trung tâm có lớp học tiếng Trung HSK 3 vào buổi tối không?'],
            ['Lê Thu Thảo', '0966333444', 'thuthao@gmail.com', 'Cho mình xin lộ trình luyện thi TOEIC 650+ cấp tốc trong 2 tháng.'],
            ['Phạm Văn Bách', '0911444555', 'vanbach@gmail.com', 'Đăng ký nhận ưu đãi giảm 30% khóa học tiếng Anh giao tiếp.'],
        ];

        foreach ($requests as $idx => [$name, $phone, $email, $msg]) {
            DB::table('contact_requests')->updateOrInsert(
                ['phone' => $phone],
                [
                    'full_name'   => $name,
                    'email'       => $email,
                    'center_name' => 'Trung tâm Ngoại ngữ Sam',
                    'message'     => $msg,
                    'status'      => $idx % 2 === 0 ? 'contacted' : 'pending',
                    'created_at'  => $this->now,
                    'updated_at'  => $this->now,
                ]
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // THÔNG BÁO TOÀN HỆ THỐNG
    // ─────────────────────────────────────────────────────────────────────────

    private function createGlobalNotifications(Admin $superAdmin, array $centers): void
    {
        $this->command->info('  🔔 Tạo thông báo hệ thống...');

        $notifId = DB::table('notifications')->insertGetId([
            'title'               => 'Thông Báo Lịch Nghỉ Lễ & Khai Giảng Khóa Mới',
            'content'             => 'Hệ thống Sam Edu xin thông báo lịch nghỉ lễ và kế hoạch khai giảng các lớp học mới trong tháng tới. Quý thầy cô và học sinh vui lòng kiểm tra lịch học chi tiết trên ứng dụng.',
            'type'                => 'system',
            'created_by_admin_id' => $superAdmin->id,
            'created_at'          => $this->now,
            'updated_at'          => $this->now,
        ]);

        foreach ($centers as $center) {
            $adminIds = DB::table('admin_centers')->where('center_id', $center->id)->pluck('admin_id')->toArray();

            foreach ($adminIds as $aId) {
                DB::table('notification_recipients')->insert([
                    'notification_id' => $notifId,
                    'recipient_type'  => 'admin',
                    'recipient_id'    => $aId,
                    'read_at'         => null,
                    'created_at'      => $this->now,
                    'updated_at'      => $this->now,
                ]);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TỔNG KẾT
    // ─────────────────────────────────────────────────────────────────────────

    private function printSummary(): void
    {
        $this->command->info('───────────────────────────────────────────────────────');
        $this->command->info('🎉 BẢNG THỐNG KÊ DỮ LIỆU SEED MẪU:');
        $this->command->info(' - Trung tâm đào tạo: ' . Center::count());
        $this->command->info(' - Quản trị viên (Admins): ' . Admin::count());
        $this->command->info(' - Giáo viên (Teachers): ' . Teacher::count());
        $this->command->info(' - Học sinh (Students): ' . Student::count());
        $this->command->info(' - Môn học (Subjects): ' . Subject::count());
        $this->command->info(' - Phòng học (Rooms): ' . Room::count());
        $this->command->info(' - Lớp học (SchoolClasses): ' . SchoolClass::count());
        $this->command->info(' - Ca học (ClassSessions): ' . DB::table('class_sessions')->count());
        $this->command->info(' - Lượt điểm danh (Attendances): ' . DB::table('attendances')->count());
        $this->command->info(' - Loại đề thi (ExamTypes): ' . ExamType::count());
        $this->command->info(' - Đề thi (Exams): ' . Exam::count());
        $this->command->info(' - Câu hỏi đề thi (ExamQuestions): ' . ExamQuestion::count());
        $this->command->info(' - Khoản học phí (StudentTuitions): ' . DB::table('student_tuitions')->count());
        $this->command->info(' - Lịch sử thu học phí (TuitionPayments): ' . DB::table('tuition_payments')->count());
        $this->command->info('───────────────────────────────────────────────────────');
        $this->command->info('🔑 TÀI KHOẢN ĐĂNG NHẬP MẪU (Mật khẩu: password):');
        $this->command->info(' 1. Super Admin: super_admin / superadmin@sam-edu.vn');
        $this->command->info(' 2. Admin Cầu Giấy: admin_caugiay / admin.caugiay@sam-edu.vn');
        $this->command->info(' 3. Admin Quận 1: admin_quan1 / admin.quan1@sam-edu.vn');
        $this->command->info(' 4. Admin Đà Nẵng: admin_danang / admin.danang@sam-edu.vn');
        $this->command->info(' 5. Giáo viên demo: gv_cg_1, gv_q1_1, gv_dn_1');
        $this->command->info(' 6. Học sinh demo: hs_cg_01, hs_q1_01, hs_dn_01');
        $this->command->info('───────────────────────────────────────────────────────');
    }
}

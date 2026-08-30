<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Center;
use App\Models\CenterSubscription;
use App\Models\ClassChatMessage;
use App\Models\ClassChatMessageReaction;
use App\Models\ClassExam;
use App\Models\ClassExamSubmission;
use App\Models\ClassSchedule;
use App\Models\ClassSession;
use App\Models\ClassStudent;
use App\Models\ClassSubject;
use App\Models\ContactRequest;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\ExamResult;
use App\Models\ExamResultHistory;
use App\Models\ExamSection;
use App\Models\Holiday;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\PaymentTransaction;
use App\Models\RefreshToken;
use App\Models\Room;
use App\Models\RoomEquipment;
use App\Models\SchoolClass;
use App\Models\SessionReschedule;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\StudentNote;
use App\Models\StudentTuition;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TuitionPayment;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * ComprehensiveSampleDataSeeder
 *
 * Khởi tạo dữ liệu mẫu toàn diện, đồng bộ 100% tất cả các bảng trong hệ thống Sam-Edu:
 * - Hệ thống nền tảng: Super Admin, System Settings, SEO Metadata, Subscription Plans, Permissions & Roles
 * - 3 Trung tâm tại 3 miền (Hà Nội, TP.HCM, Đà Nẵng) với các gói dịch vụ Pro, Basic, Trial
 * - 3 Quản trị viên phụ (Admin) được phân công độc lập cho từng Trung tâm
 * - Lịch sử gói dịch vụ (CenterSubscription) và giao dịch thanh toán ZaloPay (PaymentTransaction)
 * - Danh mục loại đề thi (ExamType) và ngày nghỉ lễ quốc gia (Holiday)
 * - Phòng học (Room) và trang thiết bị (RoomEquipment)
 * - Môn học theo trung tâm (Subject)
 * - Đội ngũ giáo viên (Teacher) và học sinh (Student) kèm thông tin phụ huynh
 * - Lớp học (SchoolClass), học sinh ghi danh (ClassStudent), phân công giảng dạy (ClassSubject)
 * - Lịch học cố định (ClassSchedule), ca học thực tế (ClassSession), đổi lịch / báo nghỉ (SessionReschedule)
 * - Điểm danh học sinh (Attendance)
 * - Nhóm chat lớp học (ClassChatMessage) và cảm xúc tin nhắn (ClassChatMessageReaction)
 * - Ngân hàng đề thi (Exam, ExamSection, ExamQuestion đủ 9 dạng câu hỏi kèm media và đáp án chuẩn)
 * - Kỳ thi lớp học (ClassExam), bài thi nộp (ClassExamSubmission), chấm điểm và bảng điểm (ExamResult, ExamResultHistory)
 * - Quản lý học phí (StudentTuition) và biên lai thanh toán (TuitionPayment)
 * - Ghi chú học sinh (StudentNote), tài liệu đính kèm (StudentDocument)
 * - Thông báo hệ thống & thông báo trung tâm (Notification, NotificationRecipient)
 * - Yêu cầu tư vấn khách hàng (ContactRequest)
 * - Phiên đăng nhập & OTP (RefreshToken, PasswordResetOtp, AccountVerificationOtp)
 */
class ComprehensiveSampleDataSeeder extends Seeder
{
    private Carbon $now;

    public function __construct()
    {
        $this->now = Carbon::now();
    }

    public function run(): void
    {
        $this->command->info('🚀 [1/10] Khởi tạo dữ liệu cấu hình hệ thống & phân quyền...');

        // 1. Chạy các seeder nền tảng
        $this->call([
            SuperAdminSeeder::class,
            SystemContentSeeder::class,
            SubscriptionPlanSeeder::class,
            SeoMetadataSeeder::class,
            PermissionSeeder::class,
        ]);

        $this->command->info('📦 [2/10] Khởi tạo dữ liệu liên kết trung tâm...');

        DB::transaction(function () {
            // 2. Lấy Super Admin
            $superAdmin = Admin::where('role', 'super_admin')->first() ?? $this->createSuperAdmin();

            // 3. Ngày lễ quốc gia
            $nationalHolidays = $this->createNationalHolidays();

            // 4. Khởi tạo 3 Trung tâm tại 3 miền
            $centersConfig  = $this->getCentersConfiguration();
            $createdCenters = [];

            foreach ($centersConfig as $cIdx => $config) {
                $this->command->info('🏢 [3/10] Seed chi tiết Trung tâm #' . ($cIdx + 1) . ": {$config['name']}...");
                $createdCenters[] = $this->seedCenter($config, $nationalHolidays, $superAdmin);
            }

            // 5. Yêu cầu tư vấn Landing Page
            $this->command->info('📞 [8/10] Khởi tạo yêu cầu tư vấn & khách hàng tiềm năng...');
            $this->seedContactRequests();

            // 6. Thông báo hệ thống & Thông báo trung tâm
            $this->command->info('🔔 [9/10] Khởi tạo thông báo toàn hệ thống...');
            $this->seedNotifications($superAdmin, $createdCenters);

            // 7. Khởi tạo mã OTP và Refresh Tokens mẫu cho Auth Test
            $this->command->info('🔑 [10/10] Khởi tạo mã xác thực OTP & Token phiên đăng nhập...');
            $this->seedAuthTokensAndOtps($createdCenters);
        });

        $this->command->info('🎉 Hoàn tất nạp dữ liệu mẫu toàn diện cho tất cả các bảng!');
        $this->printSummary();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SUPER ADMIN FALLBACK
    // ─────────────────────────────────────────────────────────────────────────

    private function createSuperAdmin(): Admin
    {
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
    // 2. NGÀY NGHỈ LỄ QUỐC GIA
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array<int, Holiday>
     */
    private function createNationalHolidays(): array
    {
        $year     = $this->now->year;
        $holidays = [
            ['Tết Dương Lịch', "{$year}-01-01", false, false, 'Nghỉ Tết Dương Lịch toàn quốc'],
            ['Tết Nguyên Đán (Mùng 1)', "{$year}-01-29", true, false, 'Nghỉ Tết Âm Lịch cổ truyền'],
            ['Tết Nguyên Đán (Mùng 2)', "{$year}-01-30", true, false, 'Nghỉ Tết Âm Lịch cổ truyền'],
            ['Tết Nguyên Đán (Mùng 3)', "{$year}-01-31", true, false, 'Nghỉ Tết Âm Lịch cổ truyền'],
            ['Giỗ Tổ Hùng Vương', "{$year}-04-07", true, false, 'Nghỉ Giỗ Tổ 10/3 Âm lịch'],
            ['Giải Phóng Miền Nam', "{$year}-04-30", false, true, 'Kỷ niệm ngày Giải phóng miền Nam 30/4'],
            ['Quốc Tế Lao Động', "{$year}-05-01", false, true, 'Kỷ niệm ngày Quốc tế Lao động 1/5'],
            ['Quốc Khánh 2/9', "{$year}-09-02", false, true, 'Nghỉ lễ Quốc Khánh nước CHXHCNVN'],
        ];

        $results = [];

        foreach ($holidays as [$name, $date, $isLunar, $isRecurring, $desc]) {
            $h = Holiday::updateOrCreate(
                ['date' => $date, 'name' => $name],
                [
                    'year'         => (int) date('Y', strtotime($date)),
                    'is_lunar'     => $isLunar,
                    'is_recurring' => $isRecurring,
                    'description'  => $desc,
                ]
            );
            $results[] = $h;
        }

        return $results;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. CẤU HÌNH DỮ LIỆU 3 TRUNG TÂM
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getCentersConfiguration(): array
    {
        return [
            [
                'code'              => 'CTR000000001',
                'name'              => 'Trung Tâm Giáo Dục Sam Edu - Cầu Giấy (Hà Nội)',
                'phone'             => '02438889999',
                'email'             => 'caugiay@sam-edu.vn',
                'address'           => 'Tầng 5, Tòa nhà SAM Tower, Số 18 Duy Tân, Cầu Giấy, Hà Nội',
                'subscription_plan' => 'advanced_20',
                'plan_name'         => 'Gói Nâng Cao (20 Lớp)',
                'plan_type'         => 'advanced',
                'max_students'      => 600,
                'max_classes'       => 20,
                'teacher_prefix'    => 'gv_cg',
                'student_prefix'    => 'hs_cg',
                'class_prefix'      => 'CG',
                'admin'             => [
                    'admin_code' => 'ADM000000001',
                    'username'   => 'admin_caugiay',
                    'email'      => 'admin.caugiay@sam-edu.vn',
                    'full_name'  => 'Nguyễn Hoàng Long',
                    'phone'      => '0912111222',
                ],
                'rooms' => [
                    ['code' => 'R000000001', 'name' => 'Phòng 201 - IELTS Master Lab', 'capacity' => 30],
                    ['code' => 'R000000002', 'name' => 'Phòng 202 - Studio Luyện Thi', 'capacity' => 25],
                    ['code' => 'R000000003', 'name' => 'Phòng 301 - Hội Thảo Đa Năng', 'capacity' => 45],
                    ['code' => 'R000000004', 'name' => 'Phòng 302 - Smart Classroom', 'capacity' => 20],
                ],
                'subjects' => [
                    ['code' => 'S000000001', 'name' => 'Luyện Thi IELTS Intensive 7.5+', 'fee' => 6500000, 'sessions' => 36, 'duration' => 90],
                    ['code' => 'S000000002', 'name' => 'Khóa Học TOEIC 4 Kỹ Năng 850+', 'fee' => 4500000, 'sessions' => 24, 'duration' => 90],
                    ['code' => 'S000000003', 'name' => 'Tiếng Anh Giao Tiếp Doanh Nghiệp Pro', 'fee' => 3800000, 'sessions' => 20, 'duration' => 75],
                    ['code' => 'S000000004', 'name' => 'Tiếng Trung Thương Mại HSK 5', 'fee' => 5200000, 'sessions' => 30, 'duration' => 90],
                ],
            ],
            [
                'code'              => 'CTR000000002',
                'name'              => 'Trung Tâm Ngoại Ngữ Sam Edu - Quận 1 (TP.HCM)',
                'phone'             => '02839998888',
                'email'             => 'quan1@sam-edu.vn',
                'address'           => 'Tòa nhà Bitexco Financial, 02 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
                'subscription_plan' => 'basic_20',
                'plan_name'         => 'Gói Cơ Bản (20 Lớp)',
                'plan_type'         => 'basic',
                'max_students'      => 600,
                'max_classes'       => 20,
                'teacher_prefix'    => 'gv_q1',
                'student_prefix'    => 'hs_q1',
                'class_prefix'      => 'Q1',
                'admin'             => [
                    'admin_code' => 'ADM000000002',
                    'username'   => 'admin_quan1',
                    'email'      => 'admin.quan1@sam-edu.vn',
                    'full_name'  => 'Trần Thanh Thảo',
                    'phone'      => '0933222333',
                ],
                'rooms' => [
                    ['code' => 'R000000005', 'name' => 'Phòng Sài Gòn - Luyện Nghe Nhìn', 'capacity' => 28],
                    ['code' => 'R000000006', 'name' => 'Phòng Bến Thành - Speaking Club', 'capacity' => 22],
                    ['code' => 'R000000007', 'name' => 'Phòng Chợ Lớn - HSK Tiếng Hoa', 'capacity' => 25],
                ],
                'subjects' => [
                    ['code' => 'S000000005', 'name' => 'IELTS Academic Writing & Speaking Boost', 'fee' => 5800000, 'sessions' => 28, 'duration' => 90],
                    ['code' => 'S000000006', 'name' => 'Tiếng Nhật Cấp Tốc JLPT N3', 'fee' => 4200000, 'sessions' => 32, 'duration' => 90],
                    ['code' => 'S000000007', 'name' => 'Tiếng Hàn Giao Tiếp TOPIK II', 'fee' => 3900000, 'sessions' => 24, 'duration' => 75],
                ],
            ],
            [
                'code'              => 'CTR000000003',
                'name'              => 'Học Viện Quốc Tế Sam Edu - Hải Châu (Đà Nẵng)',
                'phone'             => '02363777888',
                'email'             => 'danang@sam-edu.vn',
                'address'           => 'Số 88 Đường Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng',
                'subscription_plan' => 'trial',
                'plan_name'         => 'Gói Dùng Thử (1 Tháng)',
                'plan_type'         => 'trial',
                'max_students'      => 600,
                'max_classes'       => 20,
                'teacher_prefix'    => 'gv_dn',
                'student_prefix'    => 'hs_dn',
                'class_prefix'      => 'DN',
                'admin'             => [
                    'admin_code' => 'ADM000000003',
                    'username'   => 'admin_danang',
                    'email'      => 'admin.danang@sam-edu.vn',
                    'full_name'  => 'Lê Quang Vinh',
                    'phone'      => '0944333444',
                ],
                'rooms' => [
                    ['code' => 'R000000008', 'name' => 'Phòng Sông Hàn - Digital Testing', 'capacity' => 25],
                    ['code' => 'R000000009', 'name' => 'Phòng Cầu Rồng - Active Learning', 'capacity' => 20],
                ],
                'subjects' => [
                    ['code' => 'S000000008', 'name' => 'IELTS Foundation 5.0 - 6.0', 'fee' => 4500000, 'sessions' => 30, 'duration' => 90],
                    ['code' => 'S000000009', 'name' => 'Tiếng Anh Trẻ Em Cambridge Starters', 'fee' => 3200000, 'sessions' => 24, 'duration' => 60],
                ],
            ],
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. SEED HOÀN CHỈNH CHO 1 TRUNG TÂM
    // ─────────────────────────────────────────────────────────────────────────

    private function seedCenter(array $config, array $nationalHolidays, Admin $superAdmin): Center
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
                'plan_type'         => $config['plan_type'],
                'expires_at'        => Carbon::now()->addYear(),
                'max_students'      => $config['max_students'],
                'max_classes'       => $config['max_classes'],
            ]
        );

        // B. Tạo Admin phụ & gán phân công
        $subAdmin = Admin::where('username', $config['admin']['username'])
            ->orWhere('admin_code', $config['admin']['admin_code'])
            ->orWhere('email', $config['admin']['email'])
            ->first();

        if ($subAdmin) {
            $subAdmin->update([
                'admin_code' => $config['admin']['admin_code'],
                'username'   => $config['admin']['username'],
                'email'      => $config['admin']['email'],
                'password'   => Hash::make('password'),
                'full_name'  => $config['admin']['full_name'],
                'phone'      => $config['admin']['phone'],
                'role'       => 'admin',
                'status'     => 'active',
            ]);
        } else {
            $subAdmin = Admin::create([
                'admin_code' => $config['admin']['admin_code'],
                'username'   => $config['admin']['username'],
                'email'      => $config['admin']['email'],
                'password'   => Hash::make('password'),
                'full_name'  => $config['admin']['full_name'],
                'phone'      => $config['admin']['phone'],
                'role'       => 'admin',
                'status'     => 'active',
            ]);
        }
        $subAdmin->centers()->sync([$center->id]);

        // C. Tạo Lịch sử gói dịch vụ (center_subscriptions) & Giao dịch ZaloPay (payment_transactions)
        $subPrice = match ($config['subscription_plan']) {
            'advanced_20' => 9600000,
            'trial'       => 0,
            default       => 4800000,
        };

        $subscription = CenterSubscription::updateOrCreate(
            ['center_id' => $center->id, 'plan_code' => $config['subscription_plan']],
            [
                'plan_name'     => $config['plan_name'],
                'price'         => $subPrice,
                'duration_days' => 365,
                'starts_at'     => Carbon::now()->subMonths(2)->toDateTimeString(),
                'ends_at'       => Carbon::now()->addMonths(10)->toDateTimeString(),
                'status'        => 'active',
            ]
        );

        PaymentTransaction::updateOrCreate(
            ['app_trans_id' => sprintf('%s_CTR%04d', date('ymd'), $center->id)],
            [
                'center_id'              => $center->id,
                'center_subscription_id' => $subscription->id,
                'payment_method'         => 'zalopay',
                'amount'                 => $subPrice,
                'status'                 => 'success',
                'zp_trans_id'            => 'ZP' . sprintf('%010d', rand(1000000000, 9999999999)),
                'payload'                => [
                    'return_code'    => 1,
                    'return_message' => 'Giao dịch thành công',
                    'bank_code'      => 'ZALOPAYAPP',
                ],
                'paid_at' => Carbon::now()->subMonths(2),
            ]
        );

        // E. Tạo Phòng học & Thiết bị
        $rooms = $this->createRoomsForCenter($center, $config['rooms']);

        // F. Tạo Môn học
        $subjects = $this->createSubjectsForCenter($center, $config['subjects']);

        // G. Tạo Giáo viên
        $teachers = $this->createTeachersForCenter($center, $config['teacher_prefix']);

        // H. Tạo Học sinh
        $students = $this->createStudentsForCenter($center, $config['student_prefix']);

        // Dọn dẹp dữ liệu cũ của trung tâm để khởi tạo lại đồng bộ
        $centerClassIds = SchoolClass::withTrashed()->where('center_id', $center->id)->pluck('id')->toArray();

        if (! empty($centerClassIds)) {
            $csIds   = ClassSubject::whereIn('class_id', $centerClassIds)->pluck('id')->toArray();
            $sessIds = ClassSession::whereIn('class_subject_id', $csIds)->pluck('id')->toArray();

            if (! empty($sessIds)) {
                DB::table('attendances')->whereIn('session_id', $sessIds)->delete();
                SessionReschedule::whereIn('session_id', $sessIds)->delete();
                ClassSession::whereIn('id', $sessIds)->delete();
            }
            ClassSchedule::whereIn('class_subject_id', $csIds)->delete();
            ClassStudent::whereIn('class_id', $centerClassIds)->delete();
            ClassChatMessageReaction::whereIn('class_id', $centerClassIds)->delete();
            ClassChatMessage::whereIn('class_id', $centerClassIds)->delete();
            ClassExamSubmission::whereIn('class_exam_id', function ($q) use ($centerClassIds) {
                $q->select('id')->from('class_exams')->whereIn('class_id', $centerClassIds);
            })->delete();
            ClassExam::whereIn('class_id', $centerClassIds)->delete();
            StudentTuition::whereIn('class_id', $centerClassIds)->delete();
            ClassSubject::whereIn('class_id', $centerClassIds)->delete();
            SchoolClass::withTrashed()->whereIn('id', $centerClassIds)->forceDelete();
        }

        // I. Tạo Lớp học, Lịch học, Ca học, Đổi lịch, Điểm danh, Chat & Reactions
        $classes = $this->createClassesAndSchedules(
            $center,
            $subjects,
            $teachers,
            $rooms,
            $students,
            $config['class_prefix'],
            $nationalHolidays,
            $subAdmin
        );

        // J. Tạo Ngân hàng Đề thi, Đề thi Lớp, Bài nộp, Chấm điểm & Lịch sử sửa điểm
        $this->createExamsAndSubmissions(
            $center,
            $subjects,
            $teachers,
            $classes,
            $students,
            $subAdmin
        );

        // K. Tạo Khoản thu học phí & Lịch sử đóng tiền
        $this->createTuitionsAndPayments($center, $classes, $students, $subAdmin);

        // L. Ghi chú học sinh, Tài liệu học tập
        $this->createStudentNotesAndDocs($center, $teachers, $students, $subAdmin);

        return $center;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHÒNG HỌC & THIẾT BỊ PHÒNG
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
                    'code'      => $r['code'],
                ],
                [
                    'name'     => $r['name'],
                    'capacity' => $r['capacity'],
                    'status'   => 'active',
                ]
            );

            // Gắn trang thiết bị phòng học
            RoomEquipment::updateOrCreate(
                ['room_id' => $room->id, 'name' => 'Máy chiếu Laser 4K Full HD'],
                ['quantity' => 1, 'status' => 'good']
            );
            RoomEquipment::updateOrCreate(
                ['room_id' => $room->id, 'name' => 'Hệ thống Loa Bluetooth Audio Test'],
                ['quantity' => 2, 'status' => 'good']
            );
            RoomEquipment::updateOrCreate(
                ['room_id' => $room->id, 'name' => 'Điều hòa 2 chiều Inverter 24000BTU'],
                ['quantity' => 2, 'status' => 'good']
            );
            RoomEquipment::updateOrCreate(
                ['room_id' => $room->id, 'name' => 'Bàn ghế thông minh chuẩn quốc tế'],
                ['quantity' => $r['capacity'], 'status' => 'good']
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
                    'code'      => $s['code'],
                ],
                [
                    'name'             => $s['name'],
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

            $teacher = Teacher::where('username', $username)
                ->orWhere('teacher_code', $code)
                ->orWhere('email', "{$username}@sam-edu.vn")
                ->first();

            $teacherData = [
                'username'       => $username,
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
            ];

            if ($teacher) {
                $teacher->update($teacherData);
            } else {
                $teacher = Teacher::create($teacherData);
            }

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
        $firstNames  = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
        $middleNames = ['Văn', 'Thị', 'Đức', 'Hải', 'Quang', 'Minh', 'Ngọc', 'Thu', 'Hữu', 'Bảo', 'Gia', 'Khánh', 'Anh', 'Thanh', 'Tuấn'];
        $lastNames   = ['Nam', 'An', 'Bình', 'Cường', 'Dương', 'Hà', 'Huy', 'Khoa', 'Linh', 'Long', 'My', 'Phong', 'Trang', 'Tú', 'Uyên', 'Vy', 'Đạt', 'Dũng', 'Tiến', 'Hương', 'Nhi', 'Hùng', 'Sơn', 'Thảo'];

        $relationships = ['Bố', 'Mẹ', 'Người giám hộ'];

        $students      = [];
        $totalStudents = 24; // 24 học sinh mỗi trung tâm để phân bổ phong phú các lớp

        for ($i = 1; $i <= $totalStudents; $i++) {
            $fn       = $firstNames[($i + $center->id * 3) % count($firstNames)] . ' ' . $middleNames[($i * 2 + $center->id * 5) % count($middleNames)];
            $ln       = $lastNames[($i * 3 + $center->id * 7) % count($lastNames)];
            $fullName = "{$fn} {$ln}";

            $username = "{$prefix}_" . sprintf('%02d', $i);
            $code     = sprintf('STD%09d', ($center->id * 1000) + $i);
            $gender   = $i % 2 === 0 ? 'female' : 'male';
            $dob      = Carbon::now()->subYears(15 + ($i % 6))->subDays($i * 12)->toDateString();

            $parentName  = 'Phụ huynh ' . ($gender === 'female' ? 'Mẹ em ' : 'Bố em ') . $ln;
            $parentPhone = '098' . sprintf('%07d', ($center->id * 100000) + $i);
            $parentRel   = $relationships[$i % count($relationships)];

            $student = Student::where('username', $username)
                ->orWhere('student_code', $code)
                ->orWhere('email', "{$username}@student.sam-edu.vn")
                ->first();

            $studentData = [
                'username'            => $username,
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
                'admission_date'      => Carbon::now()->subMonths(1 + ($i % 5))->toDateString(),
                'status'              => 1, // 1 = active (tinyint)
            ];

            if ($student) {
                $student->update($studentData);
            } else {
                $student = Student::create($studentData);
            }

            $students[] = $student;
        }

        return $students;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LỚP HỌC, LỊCH HỌC, CA HỌC, ĐỔI LỊCH, ĐIỂM DANH, CHAT & REACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @param  array<int, Subject>     $subjects
     * @param  array<int, Teacher>     $teachers
     * @param  array<int, Room>        $rooms
     * @param  array<int, Student>     $students
     * @param  array<int, Holiday>     $nationalHolidays
     * @param  Center                  $center
     * @param  string                  $classPrefix
     * @param  Admin                   $subAdmin
     * @return array<int, SchoolClass>
     */
    private function createClassesAndSchedules(
        Center $center,
        array $subjects,
        array $teachers,
        array $rooms,
        array $students,
        string $classPrefix,
        array $nationalHolidays,
        Admin $subAdmin
    ): array {
        $classes    = [];
        $holidayIds = array_map(fn ($h) => $h->id, $nationalHolidays);

        // Mẫu nhận xét điểm danh đa dạng, sinh động
        $presentNotes = [
            'Có mặt đúng giờ, hăng hái phát biểu xây dựng bài.',
            'Làm bài tập về nhà đầy đủ, phát âm chuẩn xác.',
            'Tham gia thảo luận nhóm sôi nổi, đóng góp nhiều ý tưởng.',
            'Hoàn thành xuất sắc bài kiểm tra ngắn đầu giờ (10/10).',
            'Tập trung lắng nghe, ghi chép bài cẩn thận và tiếp thu nhanh.',
            'Tương tác tốt với giáo viên và các bạn trong lớp.',
            'Phát âm chuẩn, ngữ điệu tự nhiên trong phần thực hành nói.',
        ];

        $lateNotes = [
            'Đến muộn 10 phút do kẹt xe giờ cao điểm, đã bổ sung bài.',
            'Vào lớp muộn 15 phút do bận kiểm tra tại trường chính khóa.',
            'Đến trễ 10 phút, đã chủ động liên hệ bạn để chép lại bài đầu giờ.',
            'Đến muộn 20 phút do thời tiết mưa to, đã được giáo viên bù bài cuối giờ.',
        ];

        $excusedNotes = [
            'Nghỉ có phép - Phụ huynh gọi điện báo học sinh bị sốt/ốm.',
            'Nghỉ có phép - Gia đình bận việc đột xuất, đã gửi đơn xin phép.',
            'Nghỉ có phép - Trùng lịch thi khảo sát chất lượng tại trường THPT.',
            'Nghỉ có phép - Học sinh tham gia đội tuyển học sinh giỏi của trường.',
        ];

        $leaveNotes = [
            'Xin phép về sớm 30 phút do có lịch hẹn khám nha khoa/bác sĩ.',
            'Xin phép ra sớm 20 phút vì việc gia đình đột xuất.',
            'Xin phép về sớm 15 phút do phải kịp chuyến xe về quê.',
        ];

        $absentNotes = [
            'Vắng không phép, giáo vụ trung tâm đã liên hệ phụ huynh để nắm tình hình.',
            'Nghỉ học không báo trước, chưa liên lạc được với học sinh.',
            'Vắng mặt không lý do.',
        ];

        // Ngân hàng chủ đề bài giảng theo từng chuyên môn
        $topicsLibrary = [
            'IELTS' => [
                'Orientation, Diagnostic Assessment & Lộ trình cá nhân hóa',
                'Phonetics Mastery & Connected Speech Patterns trong IELTS Speaking',
                'Listening Section 1: Note Completion & Form Filling Tactics',
                'Reading: Skimming & Scanning Speed Reading Drills',
                'Writing Task 1: Interpreting Charts, Line Graphs & Trend Vocabulary',
                'Speaking Part 1: Fluency, Coherence & Expanding Short Answers',
                'Listening Section 2: Multiple Choice & Map Labeling Techniques',
                'Reading: True / False / Not Given & Identifying Writer Views',
                'Writing Task 2: Agree/Disagree & Discussion Essay Structures',
                'Speaking Part 2: Structuring Cue Card 1-Minute Preparation',
                'Listening Section 3: Academic Discussions & Signal Words',
                'Reading: Matching Headings & Paragraph Summary Strategies',
                'Writing Task 1: Describing Processes, Maps & Complex Cycles',
                'Speaking Part 3: Abstract Discussion & Complex Hypothesis Formation',
                'Listening Section 4: Academic Lectures & Fast-Paced Dictation',
                'Reading: Multiple Choice & Sentence Completion Tactics',
                'Writing Task 2: Problem - Solution & Two-Part Question Models',
                'Full Mock Test Simulation (Listening & Reading Modules)',
                'Comprehensive Exam Review, Common Pitfalls & Band Score Boost',
                'Final Individual Speaking Assessment & Personalized Feedback',
                'Mastering Collocations & Idiomatic Expressions for Band 7.5+',
                'Writing Task 2: Advanced Cohesion and Coherence Devices',
                'Speed Reading Strategies for Academic Scientific Texts',
                'Targeted Practice: Complex Pronunciation & Intonation Rules',
            ],
            'TOEIC' => [
                'Tổng quan cấu trúc TOEIC & Phương pháp đạt mục tiêu 850+',
                'Part 1: Phân tích hình ảnh người và vật, bẫy thì động từ',
                'Part 2: Kỹ năng bắt từ khóa (Wh-questions & Tag questions)',
                'Part 3: Đoạn hội thoại ngắn tại văn phòng & Suy luận ý định',
                'Part 4: Bài phát biểu, thông báo & Đọc lướt câu hỏi trước',
                'Part 5: 100 dạng ngữ pháp trọng điểm (Từ loại & Mệnh đề quan hệ)',
                'Part 6: Điền từ vào đoạn văn bản & Liên từ kết nối',
                'Part 7: Đọc hiểu văn bản đơn, email & Đơn hàng thương mại',
                'Part 7 Nâng cao: Đọc hiểu văn bản đôi và ba',
                'Luyện đề Full Test TOEIC Part 1 - Part 4',
                'Luyện đề Full Test TOEIC Part 5 - Part 7',
                'Tổng kết khóa học, chữa đề chi tiết & Chiến thuật phòng thi',
                'Từ vựng chuyên sâu về Hợp đồng, Mua bán & Chuỗi cung ứng',
                'Ngữ pháp nâng cao: Đảo ngữ & Cấu trúc câu điều kiện rút gọn',
                'Kỹ thuật phân bổ thời gian 75 phút cho phần Reading TOEIC',
                'Chữa đề ETS TOEIC Test 01 & Giải thích chi tiết từng bẫy',
            ],
            'COMMUNICATION' => [
                'Social Networking & Self Introduction in Professional Contexts',
                'Daily Office Conversations & Small Talk Techniques',
                'Email Etiquette & Professional Business Correspondence',
                'Handling Telephone Inquiries & Customer Service Excellence',
                'Conducting Effective Meetings & Leading Discussions',
                'Delivering Impactful Business Presentations',
                'Negotiation Skills & Resolving Workplace Conflicts',
                'Cross-cultural Communication in Multinational Companies',
                'Job Interview Preparation & Mock Interviews with Native Speaker',
                'Final Project Presentation & Certification Awarding',
                'Vocabulary for Marketing, Finance & Sales Pitching',
                'Debating Current Social & Economic Topics in English',
            ],
            'CHINESE' => [
                'Nhập môn phát âm chuẩn Pinyin & Quy tắc biến điệu thanh điệu',
                'Các bộ thủ thông dụng & Phương pháp nhớ chữ Hán nhanh',
                'Giao tiếp hàng ngày: Chào hỏi, giới thiệu bản thân & gia đình',
                'Chủ đề mua sắm, hỏi giá & Phương thức thanh toán điện tử',
                'Chủ đề ẩm thực, gọi món & Đặt phòng nhà hàng',
                'Chủ đề hỏi đường, phương tiện giao thông & Du lịch',
                'Chủ đề thời tiết, sở thích & Lịch trình hoạt động',
                'Ngữ pháp trọng điểm HSK: Câu chữ 把, câu chữ 被 & Bổ ngữ kết quả',
                'Luyện kỹ năng Đọc hiểu văn bản HSK & Bài tập nối câu',
                'Luyện kỹ năng Nghe hiểu hội thoại thực tế',
                'Luyện viết đoạn văn ngắn giới thiệu về sở thích cá nhân',
                'Tổng ôn tập HSK & Thi thử chuẩn hóa quốc tế',
                'Ngữ pháp HSK 5: Phân biệt các cặp liên từ dễ gây nhầm lẫn',
                'Kỹ năng viết luận ngắn 80 chữ theo từ khóa cho trước',
            ],
            'JAPANESE' => [
                'Tổng ôn tập bảng chữ cái Hiragana & Katakana',
                'Từ vựng trọng tâm N3 theo chủ đề Đời sống sinh hoạt',
                'Ngữ pháp N3: Các mẫu câu diễn đạt mục đích và nguyên nhân',
                'Ngữ pháp N3: Các mẫu câu phỏng đoán và truyền đạt thông tin',
                'Luyện đọc hiểu N3: Đoạn văn ngắn và trung bình',
                'Luyện nghe hiểu N3: Nghe hiểu tình huống thực tế và bài phát biểu',
                'Hán tự (Kanji) N3: 150 chữ Hán thường gặp trong kỳ thi',
                'Thi thử toàn diện JLPT N3 & Phân tích đáp án chi tiết',
                'Kính ngữ Sonkeigo và Khiêm nhường ngữ Kenjougo trong công sở',
                'Luyện đề Dokkai chuyên sâu dạng so sánh ý kiến tác giả',
            ],
            'KOREAN' => [
                'Bảng chữ cái Hangul & Quy tắc phát âm nối âm, biến âm',
                'Từ vựng TOPIK II: Đời sống văn phòng và môi trường làm việc',
                'Ngữ pháp trung cấp: Thể sai khiến, bị động và giả định',
                'Luyện kỹ năng Đọc hiểu TOPIK II: Đoạn văn tin tức và xã hội',
                'Luyện kỹ năng Viết TOPIK II: Viết bài luận 600-700 chữ câu 53, 54',
                'Luyện kỹ năng Nghe TOPIK II: Hội thoại nhiều người và tin tức',
                'Thi thử mô phỏng TOPIK II & Tổng kết lộ trình',
                'Các quán dụng ngữ và tục ngữ tiếng Hàn thường xuất hiện trong đề thi',
                'Kỹ năng phân tích biểu đồ câu 53 TOPIK II đạt điểm tối đa',
            ],
            'KIDS' => [
                'Hello World: Greetings, Alphabet & Colors Exploration',
                'My Lovely Family & Pets: Animal Kingdom Vocabulary',
                'Numbers, Shapes & Counting Adventures',
                'My School, Classroom Objects & Action Verbs',
                'Food & Drinks: Yummy Snacks and Healthy Habits',
                'My Body & Clothes: Daily Routine and Dressing Up',
                'Weather & Seasons: Outdoor Games and Activities',
                'Story Time: Fun Fairy Tales & Role Playing Games',
                'Cambridge Starters Mock Test: Listening & Coloring Fun',
                'Cambridge Starters Mock Test: Speaking Show & Tell',
                'Mini Drama: Animals in the Jungle Show',
                'Song & Rhyme: Phonics Fun with Teacher and Friends',
            ],
        ];

        // Xây dựng danh sách các lớp học phong phú cho từng Trung tâm
        // Bao gồm: Lớp đang học (ca tối, ca sáng, ca chiều, cuối tuần) + Lớp đã hoàn thành để dữ liệu thống kê lịch sử dồi dào
        $classesPlan = [];

        foreach ($subjects as $sIdx => $subj) {
            $subjKey = 'IELTS';

            if (str_contains($subj->name, 'TOEIC')) {
                $subjKey = 'TOEIC';
            } elseif (str_contains($subj->name, 'Giao Tiếp')) {
                $subjKey = 'COMMUNICATION';
            } elseif (str_contains($subj->name, 'Trung') || str_contains($subj->name, 'HSK')) {
                $subjKey = 'CHINESE';
            } elseif (str_contains($subj->name, 'Nhật') || str_contains($subj->name, 'JLPT')) {
                $subjKey = 'JAPANESE';
            } elseif (str_contains($subj->name, 'Hàn') || str_contains($subj->name, 'TOPIK')) {
                $subjKey = 'KOREAN';
            } elseif (str_contains($subj->name, 'Trẻ Em') || str_contains($subj->name, 'Cambridge')) {
                $subjKey = 'KIDS';
            }

            // 1. Lớp Đang học (Active) - Khóa chính (Ca tối 2-4-6 hoặc 3-5-7)
            $teacher1 = $teachers[$sIdx % count($teachers)];
            $room1    = $rooms[$sIdx % count($rooms)];
            $days1    = $sIdx % 2 === 0 ? [1, 3, 5] : [2, 4, 6]; // 1: T2, 3: T4, 5: T6 | 2: T3, 4: T5, 6: T7
            $startT1  = $sIdx % 2 === 0 ? '18:00' : '19:45';
            $endT1    = $sIdx % 2 === 0 ? '19:30' : '21:15';

            $classesPlan[] = [
                'subject'      => $subj,
                'teacher'      => $teacher1,
                'room'         => $room1,
                'name'         => "Lớp {$subj->name} - K1 ({$classPrefix})",
                'code_suffix'  => ($sIdx * 10) + 1,
                'status'       => 1, // Active
                'start_date'   => Carbon::now()->subWeeks(8)->startOfWeek(),
                'end_date'     => Carbon::now()->addWeeks(8)->endOfWeek(),
                'days'         => $days1,
                'start_time'   => $startT1,
                'end_time'     => $endT1,
                'max_students' => 25,
                'subj_key'     => $subjKey,
                'student_off'  => $sIdx * 3,
            ];

            // 2. Lớp Đã hoàn thành (Completed - status = 2) cho 2 môn đầu tiên của trung tâm
            // Để đảm bảo có dữ liệu lịch sử thống kê đầy đủ cho các tháng trước (tháng 5, 6, 7, 8)
            if ($sIdx < 2) {
                $teacher2 = $teachers[($sIdx + 1) % count($teachers)];
                $room2    = $rooms[($sIdx + 1) % count($rooms)];
                $days2    = $sIdx === 0 ? [2, 4] : [1, 4]; // T3-T5 hoặc T2-T5 sáng
                $startT2  = '08:30';
                $endT2    = '10:00';

                $classesPlan[] = [
                    'subject'      => $subj,
                    'teacher'      => $teacher2,
                    'room'         => $room2,
                    'name'         => "Lớp {$subj->name} - K-Pre ({$classPrefix})",
                    'code_suffix'  => ($sIdx * 10) + 2,
                    'status'       => 2, // Completed
                    'start_date'   => Carbon::now()->subWeeks(20)->startOfWeek(),
                    'end_date'     => Carbon::now()->subWeeks(4)->endOfWeek(),
                    'days'         => $days2,
                    'start_time'   => $startT2,
                    'end_time'     => $endT2,
                    'max_students' => 20,
                    'subj_key'     => $subjKey,
                    'student_off'  => $sIdx * 4 + 5,
                ];
            }

            // 3. Lớp Cuối tuần / Ca ngày (Active) cho môn học thứ 2 hoặc 4
            if ($sIdx % 2 === 1 || $sIdx === 0) {
                $teacher3 = $teachers[($sIdx + 2) % count($teachers)];
                $room3    = $rooms[($sIdx + 2) % count($rooms)];
                $days3    = [6, 7]; // Thứ 7, Chủ Nhật
                $startT3  = $sIdx % 2 === 0 ? '09:00' : '15:30';
                $endT3    = $sIdx % 2 === 0 ? '11:15' : '17:45';

                $classesPlan[] = [
                    'subject'      => $subj,
                    'teacher'      => $teacher3,
                    'room'         => $room3,
                    'name'         => "Lớp {$subj->name} - Weekend Intensive ({$classPrefix})",
                    'code_suffix'  => ($sIdx * 10) + 3,
                    'status'       => 1, // Active
                    'start_date'   => Carbon::now()->subWeeks(6)->startOfWeek(),
                    'end_date'     => Carbon::now()->addWeeks(6)->endOfWeek(),
                    'days'         => $days3,
                    'start_time'   => $startT3,
                    'end_time'     => $endT3,
                    'max_students' => 22,
                    'subj_key'     => $subjKey,
                    'student_off'  => $sIdx * 2 + 8,
                ];
            }
        }

        // Tạo từng lớp học, lịch học, ca học và điểm danh
        $attendanceBatch = [];

        foreach ($classesPlan as $planIdx => $plan) {
            $subject   = $plan['subject'];
            $teacher   = $plan['teacher'];
            $room      = $plan['room'];
            $classCode = sprintf('C%09d', ($center->id * 100) + $plan['code_suffix']);
            $className = $plan['name'];
            $startDate = $plan['start_date'];
            $endDate   = $plan['end_date'];
            $days      = $plan['days'];
            $startTime = $plan['start_time'];
            $endTime   = $plan['end_time'];

            // 1. Tạo Lớp học
            $schoolClass = SchoolClass::withTrashed()->updateOrCreate(
                [
                    'center_id' => $center->id,
                    'code'      => $classCode,
                ],
                [
                    'name'         => $className,
                    'max_students' => $plan['max_students'],
                    'start_date'   => $startDate->toDateString(),
                    'end_date'     => $endDate->toDateString(),
                    'status'       => $plan['status'],
                    'deleted_at'   => null,
                ]
            );

            // 2. Ghi danh học sinh vào lớp (10-14 học sinh mỗi lớp)
            $studentOffset    = $plan['student_off'] % count($students);
            $enrolledStudents = [];
            $enrollCount      = min(12, count($students));

            for ($ei = 0; $ei < $enrollCount; $ei++) {
                $enrolledStudents[] = $students[($studentOffset + $ei) % count($students)];
            }

            foreach ($enrolledStudents as $std) {
                ClassStudent::updateOrCreate(
                    [
                        'class_id'   => $schoolClass->id,
                        'student_id' => $std->id,
                    ],
                    [
                        'enrolled_at' => $startDate->toDateTimeString(),
                        'status'      => 'active',
                    ]
                );
            }

            // 3. Liên kết môn học & giáo viên phụ trách (class_subjects)
            $classSubject = ClassSubject::updateOrCreate(
                [
                    'class_id'   => $schoolClass->id,
                    'subject_id' => $subject->id,
                ],
                [
                    'teacher_id' => $teacher->id,
                    'start_date' => $startDate->toDateString(),
                    'end_date'   => $endDate->toDateString(),
                ]
            );

            // 4. Lịch học cố định hàng tuần (class_schedules)
            $weeksJson = [];

            foreach ($days as $dow) {
                $weeksJson[(string) $dow] = [
                    [
                        $startTime,
                        $endTime,
                    ],
                ];
            }

            ClassSchedule::where('class_subject_id', $classSubject->id)->delete();
            ClassChatMessage::where('class_id', $schoolClass->id)->delete();
            ClassSession::where('class_subject_id', $classSubject->id)->delete();

            $classSchedule = ClassSchedule::create([
                'class_subject_id'     => $classSubject->id,
                'weeks'                => $weeksJson,
                'off_days'             => [],
                'extra_days'           => [],
                'room_id'              => $room->id,
                'excluded_holiday_ids' => $holidayIds,
            ]);

            // 5. Sinh chuỗi Ca học thực tế (ClassSession) trải dài các tháng
            $currentDate  = clone $startDate;
            $sessionCount = 0;
            $topicsPool   = $topicsLibrary[$plan['subj_key']] ?? $topicsLibrary['IELTS'];
            $maxSessions  = $plan['status'] === 2 ? 30 : 36;

            while ($currentDate->lte($endDate) && $sessionCount < $maxSessions) {
                $dow = $currentDate->dayOfWeekIso; // 1 = Thứ 2, 2 = Thứ 3, ..., 7 = Chủ Nhật

                if (in_array($dow, $days, true)) {
                    $sessionCount++;
                    $isPast = $currentDate->lt(Carbon::now());

                    $topicTitle = $topicsPool[($sessionCount - 1) % count($topicsPool)];
                    $fullTopic  = "Bài học số {$sessionCount}: {$topicTitle}";

                    // Xác định trạng thái ca học
                    $sessionStatus = $isPast ? 'completed' : 'scheduled';
                    $sessionNote   = 'Ca học diễn ra đúng kế hoạch theo tiến độ giáo trình.';

                    // Tạo ca học đã hủy (Cancelled) mẫu để test bộ lọc & thống kê ca hủy
                    $isCancelled = false;

                    if ($plan['status'] === 1 && $sessionCount === 7 && $isPast) {
                        $isCancelled   = true;
                        $sessionStatus = 'cancelled';
                        $sessionNote   = 'Nghỉ do mưa bão diện rộng theo công điện thành phố. Buổi học được bố trí học bù vào cuối kỳ.';
                    }

                    // Tạo ca học dời lịch (Rescheduled) mẫu
                    $isRescheduled = false;

                    if ($plan['status'] === 1 && $sessionCount === 4) {
                        $isRescheduled = true;
                        $sessionStatus = 'rescheduled';
                        $sessionNote   = 'Giáo viên tham dự hội thảo chuyên môn quốc tế, dời lịch sang ngày kế tiếp.';
                    }

                    $session = ClassSession::create([
                        'class_subject_id'  => $classSubject->id,
                        'class_schedule_id' => $classSchedule->id,
                        'teacher_id'        => $teacher->id,
                        'room_id'           => $room->id,
                        'session_date'      => $currentDate->toDateString(),
                        'start_time'        => "{$startTime}:00",
                        'end_time'          => "{$endTime}:00",
                        'status'            => $sessionStatus,
                        'topic'             => $fullTopic,
                        'note'              => $sessionNote,
                    ]);

                    // Ghi nhận bản ghi dời lịch (SessionReschedule)
                    if ($isRescheduled) {
                        SessionReschedule::create([
                            'session_id'            => $session->id,
                            'old_date'              => $session->session_date,
                            'old_start_time'        => $session->start_time,
                            'old_end_time'          => $session->end_time,
                            'old_room_id'           => $room->id,
                            'new_date'              => Carbon::parse($session->session_date)->addDays(1)->toDateString(),
                            'new_start_time'        => $session->start_time,
                            'new_end_time'          => $session->end_time,
                            'new_room_id'           => $room->id,
                            'reason'                => 'Giáo viên tham dự hội thảo chuyên môn quốc tế, dời lịch sang ngày kế tiếp.',
                            'changed_by_admin_id'   => $subAdmin->id,
                            'changed_by_teacher_id' => $teacher->id,
                            'changed_at'            => $this->now->subWeeks(2),
                        ]);
                    }

                    // 6. ĐIỂM DANH HỌC SINH (Chỉ cho các ca học đã hoàn thành)
                    if ($sessionStatus === 'completed') {
                        $sessDateStr = Carbon::parse($session->session_date)->format('Y-m-d');

                        foreach ($enrolledStudents as $sIdx => $std) {
                            // Phân bổ trạng thái điểm danh thực tế (78% present, 8% late, 7% excused, 4% leave, 3% absent)
                            $hashVal = ($session->id * 17 + $std->id * 23 + $sessionCount * 7) % 100;

                            if ($hashVal < 78) {
                                $attStatus    = 'present';
                                $attNote      = $presentNotes[($session->id + $std->id) % count($presentNotes)];
                                $minBefore    = (($session->id + $std->id) % 12) + 1;
                                $checkInTime  = Carbon::parse("{$sessDateStr} {$startTime}")->subMinutes($minBefore)->toDateTimeString();
                                $checkOutTime = Carbon::parse("{$sessDateStr} {$endTime}")->toDateTimeString();
                            } elseif ($hashVal < 86) {
                                $attStatus    = 'late';
                                $attNote      = $lateNotes[($session->id + $std->id) % count($lateNotes)];
                                $lateMin      = 5 + (($session->id + $std->id) % 15);
                                $checkInTime  = Carbon::parse("{$sessDateStr} {$startTime}")->addMinutes($lateMin)->toDateTimeString();
                                $checkOutTime = Carbon::parse("{$sessDateStr} {$endTime}")->toDateTimeString();
                            } elseif ($hashVal < 93) {
                                $attStatus    = 'excused';
                                $attNote      = $excusedNotes[($session->id + $std->id) % count($excusedNotes)];
                                $checkInTime  = null;
                                $checkOutTime = null;
                            } elseif ($hashVal < 97) {
                                $attStatus    = 'leave';
                                $attNote      = $leaveNotes[($session->id + $std->id) % count($leaveNotes)];
                                $checkInTime  = Carbon::parse("{$sessDateStr} {$startTime}")->subMinutes(5)->toDateTimeString();
                                $checkOutTime = Carbon::parse("{$sessDateStr} {$endTime}")->subMinutes(30)->toDateTimeString();
                            } else {
                                $attStatus    = 'absent';
                                $attNote      = $absentNotes[($session->id + $std->id) % count($absentNotes)];
                                $checkInTime  = null;
                                $checkOutTime = null;
                            }

                            $attendanceBatch[] = [
                                'session_id'           => $session->id,
                                'student_id'           => $std->id,
                                'status'               => $attStatus,
                                'check_in_at'          => $checkInTime,
                                'check_out_at'         => $checkOutTime,
                                'note'                 => $attNote,
                                'marked_by_teacher_id' => $teacher->id,
                                'marked_by_admin_id'   => null,
                                'marked_at'            => Carbon::parse("{$sessDateStr} {$endTime}")->addMinutes(10)->toDateTimeString(),
                                'created_at'           => $this->now,
                                'updated_at'           => $this->now,
                            ];

                            if (count($attendanceBatch) >= 200) {
                                DB::table('attendances')->insert($attendanceBatch);
                                $attendanceBatch = [];
                            }
                        }
                    }
                }

                $currentDate->addDay();
            }

            // 7. Tin nhắn trao đổi lớp học (Class Chat) & Reactions
            $chatMessages = [
                [
                    'sender_type' => 'teacher',
                    'sender_id'   => $teacher->id,
                    'sender_name' => $teacher->full_name,
                    'message'     => 'Chào mừng tất cả các em đến với khóa học ' . $subject->name . '! Thầy/Cô sẽ đồng hành cùng các bạn trong suốt quá trình học tập.',
                    'is_pinned'   => true,
                    'reply_to_id' => null,
                ],
                [
                    'sender_type' => 'student',
                    'sender_id'   => $enrolledStudents[0]->id,
                    'sender_name' => $enrolledStudents[0]->full_name,
                    'message'     => 'Dạ em chào Thầy/Cô và các bạn trong lớp ạ!',
                    'is_pinned'   => false,
                    'reply_to_id' => null,
                ],
                [
                    'sender_type' => 'student',
                    'sender_id'   => $enrolledStudents[1]->id,
                    'sender_name' => $enrolledStudents[1]->full_name,
                    'message'     => 'Thầy/Cô cho em hỏi tài liệu học phần tuần này đã tải lên chưa ạ?',
                    'is_pinned'   => false,
                    'reply_to_id' => null,
                ],
            ];

            $savedMessages = [];

            foreach ($chatMessages as $msgData) {
                $createdMsg = ClassChatMessage::create([
                    'class_id'       => $schoolClass->id,
                    'reply_to_id'    => $msgData['reply_to_id'],
                    'sender_type'    => $msgData['sender_type'],
                    'sender_id'      => $msgData['sender_id'],
                    'sender_name'    => $msgData['sender_name'],
                    'message'        => $msgData['message'],
                    'is_pinned'      => $msgData['is_pinned'],
                    'pinned_at'      => $msgData['is_pinned'] ? $this->now : null,
                    'pinned_by_name' => $msgData['is_pinned'] ? $teacher->full_name : null,
                ]);
                $savedMessages[] = $createdMsg;
            }

            // Tạo tin nhắn trả lời (reply)
            if (count($savedMessages) >= 3) {
                $replyMsg = ClassChatMessage::create([
                    'class_id'       => $schoolClass->id,
                    'reply_to_id'    => $savedMessages[2]->id,
                    'sender_type'    => 'teacher',
                    'sender_id'      => $teacher->id,
                    'sender_name'    => $teacher->full_name,
                    'message'        => 'Thầy đã đính kèm tài liệu trong mục Tài liệu của lớp, các em tải về ôn tập nhé!',
                    'is_pinned'      => false,
                    'pinned_at'      => null,
                    'pinned_by_name' => null,
                ]);

                ClassChatMessageReaction::create([
                    'message_id'  => $savedMessages[0]->id,
                    'class_id'    => $schoolClass->id,
                    'sender_type' => 'student',
                    'sender_id'   => $enrolledStudents[0]->id,
                    'sender_name' => $enrolledStudents[0]->full_name,
                    'emoji'       => '❤️',
                ]);

                ClassChatMessageReaction::create([
                    'message_id'  => $savedMessages[0]->id,
                    'class_id'    => $schoolClass->id,
                    'sender_type' => 'student',
                    'sender_id'   => $enrolledStudents[1]->id,
                    'sender_name' => $enrolledStudents[1]->full_name,
                    'emoji'       => '👍',
                ]);

                ClassChatMessageReaction::create([
                    'message_id'  => $replyMsg->id,
                    'class_id'    => $schoolClass->id,
                    'sender_type' => 'student',
                    'sender_id'   => $enrolledStudents[1]->id,
                    'sender_name' => $enrolledStudents[1]->full_name,
                    'emoji'       => '🎉',
                ]);
            }

            $classes[] = $schoolClass;
        }

        // Chèn nốt số lượng attendance còn lại trong buffer
        if (! empty($attendanceBatch)) {
            DB::table('attendances')->insert($attendanceBatch);
            $attendanceBatch = [];
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
        Admin $subAdmin
    ): void {
        // 1. Tạo Đề Thi Thử Mẫu (Practice Exam 4 Kỹ Năng)
        $practiceExam = Exam::updateOrCreate(
            ['code' => sprintf('EX%09d', ($center->id * 100) + 1)],
            [
                'center_id'         => $center->id,
                'subject_id'        => $subjects[0]->id,
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

        // Clean up previous class exams & results
        ClassExam::where('class_id', $classes[0]->id)->where('exam_id', $midtermExam->id)->delete();
        ExamResult::where('exam_id', $midtermExam->id)->delete();

        // 3. Gán bài thi vào lớp học (class_exams)
        $classExam = ClassExam::create([
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
        ]);

        // 4. Sinh bài nộp của học sinh (class_exam_submissions) và bảng điểm (exam_results)
        $enrolled = DB::table('class_students')->where('class_id', $classes[0]->id)->pluck('student_id')->toArray();

        foreach ($enrolled as $sIdx => $studentId) {
            $score = round(6.5 + (($sIdx * 0.4) % 3.5), 1); // Điểm từ 6.5 -> 9.5
            $grade = $score >= 8.5 ? 'Giỏi' : ($score >= 7.0 ? 'Khá' : 'Trung Bình');

            ClassExamSubmission::create([
                'class_exam_id'         => $classExam->id,
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
                'answers'               => ['answers' => ['Q01_SINGLE' => 'B', 'Q02_MULTI' => ['A', 'C'], 'Q03_BLANK' => ['insisted', 'deadline']]],
                'teacher_feedback'      => "Học sinh làm bài cẩn thận, ngữ pháp chuẩn xác. Đạt điểm {$score}.",
            ]);

            $result = ExamResult::create([
                'exam_id'               => $midtermExam->id,
                'student_id'            => $studentId,
                'score'                 => $score,
                'grade'                 => $grade,
                'comment'               => 'Điểm thi giữa kỳ đã được giáo viên công nhận.',
                'entered_by_teacher_id' => $teachers[0]->id,
                'entered_at'            => Carbon::now()->subDays(1)->toDateTimeString(),
            ]);

            // Lịch sử sửa điểm mẫu cho học sinh đầu tiên (ExamResultHistory)
            if ($sIdx === 0) {
                ExamResultHistory::create([
                    'exam_result_id'      => $result->id,
                    'old_score'           => 7.5,
                    'new_score'           => 8.5,
                    'reason'              => 'Cộng điểm thưởng phát biểu tích cực và hoàn thành bài tập dự án nhóm xuất sắc.',
                    'changed_by_admin_id' => $subAdmin->id,
                ]);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TẠO CÁC CÂU HỎI ĐẦY ĐỦ CÂU TRẢ LỜI CHO ĐỀ THI (9 DẠNG CÂU HỎI)
    // ─────────────────────────────────────────────────────────────────────────

    private function createRichExamSectionsAndQuestions(Exam $exam): void
    {
        // Xóa các section và question cũ trước khi khởi tạo
        ExamSection::where('exam_id', $exam->id)->delete();
        ExamQuestion::where('exam_id', $exam->id)->delete();

        // ── Section 1: Đọc Hiểu & Từ Vựng (Reading) ──
        $secReading = ExamSection::create([
            'exam_id'     => $exam->id,
            'title'       => 'Phần 1: Đọc Hiểu & Từ Vựng (Reading & Lexical Resource)',
            'description' => 'Đọc kỹ đoạn văn bản bên dưới và trả lời các câu hỏi từ 1 đến 5.',
            'skill'       => 'reading',
            'order_index' => 0,
        ]);

        // 1. Single Choice
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secReading->id,
            'code'          => 'Q01_SINGLE',
            'title'         => 'Chọn từ thích hợp để hoàn thành câu (Word Choice)',
            'question_type' => 'single_choice',
            'skill'         => 'reading',
            'content'       => 'The recent technological advancements have drastically ________ the way businesses communicate globally.',
            'score'         => 1.0,
            'options'       => [
                ['id' => 'A', 'text' => 'transformed'],
                ['id' => 'B', 'text' => 'transforming'],
                ['id' => 'C', 'text' => 'transformable'],
                ['id' => 'D', 'text' => 'transformation'],
            ],
            'correct_answer' => 'A',
            'explanation'    => 'Sau trợ động từ "have" và trạng từ "drastically" cần một động từ ở dạng quá khứ phân từ (V-ed/V3) để tạo thành thì hiện tại hoàn thành.',
        ]);

        // 2. Multiple Choice
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secReading->id,
            'code'          => 'Q02_MULTI',
            'title'         => 'Chọn 2 lợi ích chính của năng lượng tái tạo (Renewable Energy Benefits)',
            'question_type' => 'multiple_choice',
            'skill'         => 'reading',
            'content'       => 'Which TWO of the following are mentioned as primary advantages of renewable energy sources in modern economies?',
            'score'         => 2.0,
            'options'       => [
                ['id' => 'A', 'text' => 'Significant reduction in greenhouse gas emissions'],
                ['id' => 'B', 'text' => 'Infinite supply with low long-term maintenance costs'],
                ['id' => 'C', 'text' => 'Immediate elimination of all industrial manufacturing costs'],
                ['id' => 'D', 'text' => 'Complete independence from geographical constraints'],
            ],
            'correct_answer' => ['A', 'B'],
            'explanation'    => 'Theo các nghiên cứu môi trường, giảm khí thải nhà kính (A) và nguồn cung vô tận với chi phí bảo trì dài hạn thấp (B) là 2 lợi ích cốt lõi nhất.',
        ]);

        // 3. Fill Blank
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secReading->id,
            'code'          => 'Q03_BLANK',
            'title'         => 'Điền từ vào chỗ trống trong đoạn văn bản (Text Completion)',
            'question_type' => 'fill_in_blank',
            'skill'         => 'reading',
            'content'       => 'The manager insisted on submitting the quarterly financial [blank_1] before the official [blank_2] tomorrow afternoon.',
            'score'         => 2.0,
            'options'       => [
                ['id' => 'blank_1', 'hint' => 'báo cáo'],
                ['id' => 'blank_2', 'hint' => 'hạn chót'],
            ],
            'correct_answer' => [
                'blank_1' => 'report',
                'blank_2' => 'deadline',
            ],
            'explanation' => 'Điền "report" (bản báo cáo tài chính) vào ô [blank_1] và "deadline" (hạn chót) vào ô [blank_2].',
        ]);

        // 4. True/False/Not Given
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secReading->id,
            'code'          => 'Q04_TF',
            'title'         => 'Xác định tính đúng sai của mệnh đề (True / False / Not Given)',
            'question_type' => 'true_false_not_given',
            'skill'         => 'reading',
            'content'       => 'According to the passage, the ancient architectural structure was completely preserved in its original form without any restoration work.',
            'score'         => 1.0,
            'options'       => [
                ['id' => 'true', 'text' => 'True (Đúng)'],
                ['id' => 'false', 'text' => 'False (Sai)'],
                ['id' => 'not_given', 'text' => 'Not Given (Không có thông tin)'],
            ],
            'correct_answer' => 'false',
            'explanation'    => 'Đoạn văn có đề cập công trình đã trải qua 3 đợt đại trùng tu lớn trong thế kỷ 20, do đó mệnh đề "không qua trùng tu" là False.',
        ]);

        // ── Section 2: Nghe Hiểu & Logic (Listening & Structure) ──
        $secListening = ExamSection::create([
            'exam_id'     => $exam->id,
            'title'       => 'Phần 2: Nghe Hiểu & Phân Tích Logic (Listening & Analytical Structure)',
            'description' => 'Lắng nghe các đoạn hội thoại mẫu và thực hiện ghép nối, sắp xếp thứ tự.',
            'skill'       => 'listening',
            'order_index' => 1,
        ]);

        // 5. Matching
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secListening->id,
            'code'          => 'Q05_MATCH',
            'title'         => 'Ghép nối thuật ngữ ngôn ngữ học với định nghĩa tương ứng (Matching Definitions)',
            'question_type' => 'matching',
            'skill'         => 'listening',
            'content'       => 'Nối các thuật ngữ chuyên ngành ở Cột A với phần giải nghĩa chính xác ở Cột B:',
            'score'         => 2.0,
            'options'       => [
                'left' => [
                    ['id' => '1', 'text' => 'Phonetics'],
                    ['id' => '2', 'text' => 'Syntax'],
                    ['id' => '3', 'text' => 'Semantics'],
                    ['id' => '4', 'text' => 'Pragmatics'],
                ],
                'right' => [
                    ['id' => 'a', 'text' => 'Nghiên cứu về âm thanh và ngữ âm trong lời nói'],
                    ['id' => 'b', 'text' => 'Nghiên cứu về quy tắc cấu trúc câu và ngữ pháp'],
                    ['id' => 'c', 'text' => 'Nghiên cứu về ý nghĩa của từ vựng và câu văn'],
                    ['id' => 'd', 'text' => 'Nghiên cứu về cách ngôn ngữ được sử dụng trong ngữ cảnh giao tiếp'],
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

        // 6. Ordering
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secListening->id,
            'code'          => 'Q06_ORDER',
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

        // 7. Diagram Labelling
        ExamQuestion::create([
            'exam_id'       => $exam->id,
            'section_id'    => $secListening->id,
            'code'          => 'Q07_DIAGRAM',
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

        // ── Section 3: Viết & Nói (Writing & Speaking) ──
        $secSpeakingWriting = ExamSection::create([
            'exam_id'     => $exam->id,
            'title'       => 'Phần 3: Kỹ Năng Viết & Nói (Writing & Speaking)',
            'description' => 'Phần thi tự luận và ghi âm phát âm trực tiếp (Giáo viên sẽ nghe và chấm điểm thủ công).',
            'skill'       => 'writing',
            'order_index' => 2,
        ]);

        // 8. Essay (Viết)
        ExamQuestion::create([
            'exam_id'        => $exam->id,
            'section_id'     => $secSpeakingWriting->id,
            'code'           => 'Q08_ESSAY',
            'title'          => 'Nghị luận về tác động của AI trong giáo dục ngôn ngữ (AI in Language Education)',
            'question_type'  => 'essay',
            'skill'          => 'writing',
            'content'        => 'Many people believe that artificial intelligence will transform education in unprecedented ways. Discuss the potential advantages and disadvantages of integrating AI tutoring systems in language learning. (Write at least 180 words).',
            'score'          => 6.0,
            'options'        => null,
            'correct_answer' => null,
            'explanation'    => 'Giáo viên đánh giá bài luận dựa trên 4 tiêu chí: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Accuracy.',
        ]);

        // 9. Audio Record (Nói)
        ExamQuestion::create([
            'exam_id'        => $exam->id,
            'section_id'     => $secSpeakingWriting->id,
            'code'           => 'Q09_SPEAKING',
            'title'          => 'Kể về trải nghiệm vượt qua thử thách học ngôn ngữ (Speaking Challenge Experience)',
            'question_type'  => 'audio_record',
            'skill'          => 'speaking',
            'content'        => 'Describe a challenging language learning experience you encountered and how you successfully overcame it. You should speak clearly into your microphone for 1.5 to 2 minutes.',
            'score'          => 6.0,
            'options'        => null,
            'correct_answer' => null,
            'explanation'    => 'Giáo viên nghe file ghi âm để chấm điểm: Fluency & Coherence, Pronunciation & Intonation, Lexical Resource, Grammatical Range.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUẢN LÝ HỌC PHÍ & LỊCH SỬ ĐÓNG TIỀN
    // ─────────────────────────────────────────────────────────────────────────

    private function createTuitionsAndPayments(Center $center, array $classes, array $students, Admin $subAdmin): void
    {
        foreach ($classes as $cIdx => $schoolClass) {
            StudentTuition::where('class_id', $schoolClass->id)->delete();
            $enrolled = DB::table('class_students')->where('class_id', $schoolClass->id)->pluck('student_id')->toArray();
            $fee      = $schoolClass->classSubjects()->first()?->subject?->tuition_fee ?? 3000000;

            foreach ($enrolled as $sIdx => $studentId) {
                $isFullPaid = $sIdx % 3 === 0;
                $isPartial  = $sIdx % 3 === 1;

                $paidAmount      = $isFullPaid ? $fee : ($isPartial ? $fee / 2 : 0);
                $remainingAmount = $fee - $paidAmount;
                $tuitionStatus   = $isFullPaid ? 'completed' : ($isPartial ? 'partial' : 'pending');

                $tuition = StudentTuition::create([
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
                ]);

                // Nếu có đóng tiền -> Tạo bản ghi biên lai trong tuition_payments
                if ($paidAmount > 0) {
                    TuitionPayment::create([
                        'student_tuition_id' => $tuition->id,
                        'amount'             => $paidAmount,
                        'payment_date'       => Carbon::now()->subDays(5)->toDateString(),
                        'payment_method'     => $isFullPaid ? 'bank_transfer' : 'cash',
                        'transaction_code'   => 'TXN' . sprintf('%08d', ($center->id * 10000) + ($cIdx * 100) + $sIdx),
                        'note'               => $isFullPaid ? 'Đóng đủ 100% học phí đầu khóa' : 'Đóng đợt 1 (50%) học phí',
                        'received_by'        => $subAdmin->id,
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
            StudentNote::where('student_id', $student->id)->delete();
            StudentDocument::where('student_id', $student->id)->delete();

            StudentNote::create([
                'student_id'            => $student->id,
                'content'               => "Em {$student->full_name} tiếp thu bài rất nhanh, tích cực tham gia phát biểu và làm bài tập về nhà đầy đủ.",
                'created_by_teacher_id' => $teacher->id,
                'created_by_admin_id'   => null,
            ]);

            StudentDocument::create([
                'student_id'             => $student->id,
                'document_type'          => 'material',
                'file_name'              => 'Tong_hop_tu_vung_unit_' . ($idx + 1) . '.pdf',
                'file_path'              => 'documents/samples/unit_' . ($idx + 1) . '.pdf',
                'file_size'              => 1024 * (500 + $idx * 100),
                'mime_type'              => 'application/pdf',
                'uploaded_by_teacher_id' => $teacher->id,
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // YÊU CẦU TƯ VẤN (CONTACT REQUESTS)
    // ─────────────────────────────────────────────────────────────────────────

    private function seedContactRequests(): void
    {
        $requests = [
            ['Nguyễn Mai Phương', '0988111222', 'maiphuong@gmail.com', 'Tôi muốn tìm hiểu khóa học IELTS Intensive cho con học lớp 11.'],
            ['Trần Quốc Toản', '0977222333', 'toan.tran@gmail.com', 'Trung tâm có lớp học tiếng Trung HSK 3 vào buổi tối không?'],
            ['Lê Thu Thảo', '0966333444', 'thuthao@gmail.com', 'Cho mình xin lộ trình luyện thi TOEIC 650+ cấp tốc trong 2 tháng.'],
            ['Phạm Văn Bách', '0911444555', 'vanbach@gmail.com', 'Đăng ký nhận ưu đãi giảm 30% khóa học tiếng Anh giao tiếp.'],
        ];

        foreach ($requests as $idx => [$name, $phone, $email, $msg]) {
            ContactRequest::updateOrCreate(
                ['phone' => $phone],
                [
                    'full_name'   => $name,
                    'email'       => $email,
                    'center_name' => 'Trung tâm Ngoại ngữ Sam Edu',
                    'message'     => $msg,
                    'status'      => $idx % 2 === 0 ? 'contacted' : 'pending',
                ]
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // THÔNG BÁO HỆ THỐNG & TRUNG TÂM
    // ─────────────────────────────────────────────────────────────────────────

    private function seedNotifications(Admin $superAdmin, array $centers): void
    {
        Notification::where('title', 'Thông Báo Lịch Nghỉ Lễ & Khai Giảng Khóa Học Mới')->delete();

        $notification = Notification::create([
            'title'               => 'Thông Báo Lịch Nghỉ Lễ & Khai Giảng Khóa Học Mới',
            'content'             => 'Hệ thống Sam-Edu xin thông báo lịch nghỉ lễ và kế hoạch khai giảng các lớp học mới trong tháng tới. Quý thầy cô và học sinh vui lòng kiểm tra lịch học chi tiết trên ứng dụng.',
            'type'                => Constant::NOTIFICATION_TYPE_GENERAL,
            'created_by_admin_id' => $superAdmin->id,
        ]);

        foreach ($centers as $center) {
            $adminIds = DB::table('admin_centers')->where('center_id', $center->id)->pluck('admin_id')->toArray();

            foreach ($adminIds as $aId) {
                NotificationRecipient::create([
                    'notification_id' => $notification->id,
                    'recipient_type'  => Constant::RECIPIENT_TYPE_ADMIN,
                    'recipient_id'    => $aId,
                    'read_at'         => null,
                ]);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MÃ XÁC THỰC OTP & TOKENS PHIÊN ĐĂNG NHẬP
    // ─────────────────────────────────────────────────────────────────────────

    private function seedAuthTokensAndOtps(array $centers): void
    {
        $center = $centers[0] ?? Center::first();

        DB::table('password_reset_otps')->where('email', 'admin.caugiay@sam-edu.vn')->delete();
        DB::table('account_verification_otps')->where('email', 'admin.caugiay@sam-edu.vn')->delete();
        RefreshToken::where('device_id', 'DEV_WEB_DEMO_001')->delete();

        // 1. Password Reset OTP
        DB::table('password_reset_otps')->insert([
            'email'        => 'admin.caugiay@sam-edu.vn',
            'account_type' => 1,
            'otp_hash'     => Hash::make('123456'),
            'expires_at'   => Carbon::now()->addMinutes(15),
            'created_at'   => $this->now,
        ]);

        // 2. Account Verification OTP
        DB::table('account_verification_otps')->insert([
            'user_type'  => 'admin',
            'user_id'    => 1,
            'email'      => 'admin.caugiay@sam-edu.vn',
            'action'     => Constant::OTP_ACTION_CHANGE_PASSWORD,
            'otp_hash'   => Hash::make('654321'),
            'payload'    => json_encode(['source' => 'system_seeder']),
            'expires_at' => Carbon::now()->addHours(24),
            'created_at' => $this->now,
        ]);

        // 3. Refresh Token mẫu
        RefreshToken::create([
            'tokenable_type' => 'admin',
            'tokenable_id'   => 1,
            'token_hash'     => hash('sha256', Str::random(40)),
            'device_id'      => 'DEV_WEB_DEMO_001',
            'device_name'    => 'Chrome on macOS',
            'device_type'    => 'web',
            'ip_address'     => '127.0.0.1',
            'user_agent'     => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            'expires_at'     => Carbon::now()->addDays(30),
            'last_used_at'   => $this->now,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TỔNG KẾT THỐNG KÊ
    // ─────────────────────────────────────────────────────────────────────────

    private function printSummary(): void
    {
        $this->command->info('───────────────────────────────────────────────────────');
        $this->command->info('🎉 BẢNG THỐNG KÊ TOÀN DIỆN TẤT CẢ CÁC BẢNG:');
        $this->command->info(' - Trung tâm đào tạo (Centers): ' . Center::count());
        $this->command->info(' - Quản trị viên (Admins): ' . Admin::count());
        $this->command->info(' - Gói dịch vụ trung tâm (CenterSubscriptions): ' . CenterSubscription::count());
        $this->command->info(' - Giao dịch ZaloPay (PaymentTransactions): ' . PaymentTransaction::count());
        $this->command->info(' - Giáo viên (Teachers): ' . Teacher::count());
        $this->command->info(' - Học sinh (Students): ' . Student::count());
        $this->command->info(' - Môn học (Subjects): ' . Subject::count());
        $this->command->info(' - Phòng học (Rooms): ' . Room::count());
        $this->command->info(' - Thiết bị phòng (RoomEquipments): ' . RoomEquipment::count());
        $this->command->info(' - Lớp học (SchoolClasses): ' . SchoolClass::count());
        $this->command->info(' - Ca học (ClassSessions): ' . ClassSession::count());
        $this->command->info(' - Đổi lịch / Báo nghỉ (SessionReschedules): ' . SessionReschedule::count());
        $this->command->info(' - Lượt điểm danh (Attendances): ' . DB::table('attendances')->count());
        $this->command->info(' - Tin nhắn chat (ClassChatMessages): ' . ClassChatMessage::count());
        $this->command->info(' - Cảm xúc chat (ClassChatMessageReactions): ' . ClassChatMessageReaction::count());
        $this->command->info(' - Ngân hàng đề thi (Exams): ' . Exam::count());
        $this->command->info(' - Phần thi & Câu hỏi (ExamQuestions): ' . ExamQuestion::count());
        $this->command->info(' - Kỳ thi lớp học (ClassExams): ' . ClassExam::count());
        $this->command->info(' - Bài nộp học sinh (ClassExamSubmissions): ' . ClassExamSubmission::count());
        $this->command->info(' - Bảng điểm (ExamResults): ' . ExamResult::count());
        $this->command->info(' - Lịch sử sửa điểm (ExamResultHistories): ' . ExamResultHistory::count());
        $this->command->info(' - Khoản thu học phí (StudentTuitions): ' . StudentTuition::count());
        $this->command->info(' - Biên lai đóng tiền (TuitionPayments): ' . TuitionPayment::count());
        $this->command->info(' - Ghi chú học sinh (StudentNotes): ' . StudentNote::count());
        $this->command->info(' - Tài liệu học sinh (StudentDocuments): ' . StudentDocument::count());
        $this->command->info(' - Yêu cầu tư vấn (ContactRequests): ' . ContactRequest::count());
        $this->command->info(' - Thông báo hệ thống (Notifications): ' . Notification::count());
        $this->command->info('───────────────────────────────────────────────────────');
        $this->command->info('🔑 TÀI KHOẢN ĐĂNG NHẬP MẪU (Mật khẩu chung: password):');
        $this->command->info(' 1. Super Admin: super_admin / superadmin@sam-edu.vn');
        $this->command->info(' 2. Admin Cầu Giấy (Hà Nội): admin_caugiay / admin.caugiay@sam-edu.vn');
        $this->command->info(' 3. Admin Quận 1 (TP.HCM): admin_quan1 / admin.quan1@sam-edu.vn');
        $this->command->info(' 4. Admin Hải Châu (Đà Nẵng): admin_danang / admin.danang@sam-edu.vn');
        $this->command->info(' 5. Giáo viên demo: gv_cg_1, gv_q1_1, gv_dn_1');
        $this->command->info(' 6. Học sinh demo: hs_cg_01, hs_q1_01, hs_dn_01');
        $this->command->info('───────────────────────────────────────────────────────');
    }
}

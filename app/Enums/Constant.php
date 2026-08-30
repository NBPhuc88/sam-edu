<?php

namespace App\Enums;

/**
 * Class Constant
 *
 * Tổng hợp toàn bộ các hằng số (constants) và giá trị mặc định quy chuẩn
 * cho toàn bộ hệ thống Giáo dục Sam Edu.
 */
class Constant
{
    // ==========================================
    // 0. TRẠNG THÁI TOÀN CỤC CHUNG (GENERIC STATUSES)
    // ==========================================
    public const int STATUS_ACTIVE   = 1; // Đang hoạt động / Bật / Hoạt động
    public const int STATUS_INACTIVE = 2; // Không hoạt động / Tắt / Khóa / Tạm dừng

    // ==========================================
    // 1. PHÂN TRANG & HIỂN THỊ (PAGINATION)
    // ==========================================
    public const int DEFAULT_PER_PAGE   = 15;
    public const int DEFAULT_PAGE       = 1;
    public const int MAX_PER_PAGE       = 100;
    public const array PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

    // ==========================================
    // 2. TIỀN TỐ VÀ QUY TẮC SINH MÃ (CODE GENERATION)
    // ==========================================
    public const int CODE_PAD_LENGTH  = 7;
    public const string CODE_PAD_CHAR = '0';

    public const string PREFIX_ROOM              = 'R';
    public const string PREFIX_SUBJECT           = 'S';
    public const string PREFIX_CLASS             = 'C';
    public const string PREFIX_CLASS_ALT         = 'CLS';
    public const string PREFIX_CENTER            = 'CTR';
    public const string PREFIX_CENTER_ALT        = 'CENTER';
    public const string PREFIX_TEACHER           = 'GV';
    public const string PREFIX_TEACHER_ALT       = 'T';
    public const string PREFIX_STUDENT           = 'HS';
    public const string PREFIX_STUDENT_ALT       = 'STD';
    public const string PREFIX_ADMIN             = 'ADM';
    public const string PREFIX_EXAM              = 'EXAM';
    public const string PREFIX_EXAM_ALT          = 'EX';
    public const string PREFIX_EXAM_TYPE         = 'ET';
    public const string PREFIX_SUBSCRIPTION_PLAN = 'PLAN';
    public const string PREFIX_CLASS_EXAM        = 'CE';

    // ==========================================
    // 3. AUTHENTICATION, GUARDS & PHÂN QUYỀN (ROLES)
    // ==========================================
    public const string GUARD_ADMIN   = 'admin';
    public const string GUARD_TEACHER = 'teacher';
    public const string GUARD_STUDENT = 'student';

    public const array GUARDS = [
        self::GUARD_ADMIN,
        self::GUARD_TEACHER,
        self::GUARD_STUDENT,
    ];

    public const int ROLE_SUPER_ADMIN       = 1;
    public const int ROLE_ADMIN             = 2;
    public const int ROLE_TEACHER           = 3;
    public const int ROLE_STUDENT           = 4;
    public const int ADMIN_ROLE_SUPER_ADMIN = 1;
    public const int ADMIN_ROLE_ADMIN       = 2;

    public const array ADMIN_ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_ADMIN,
    ];

    public const array ADMIN_ROLE_LABELS = [
        self::ROLE_SUPER_ADMIN => 'Super Admin',
        self::ROLE_ADMIN       => 'Admin Quản trị',
    ];

    public const int OTP_EXPIRATION_MINUTES        = 15;
    public const int OTP_DIGITS                    = 6;
    public const int REFRESH_TOKEN_EXPIRATION_DAYS = 30;

    // Giới tính (Gender)
    public const int GENDER_MALE   = 1;
    public const int GENDER_FEMALE = 2;
    public const int GENDER_OTHER  = 3;

    public const array GENDERS = [
        self::GENDER_MALE,
        self::GENDER_FEMALE,
        self::GENDER_OTHER,
    ];

    public const array GENDER_LABELS = [
        self::GENDER_MALE   => 'Nam',
        self::GENDER_FEMALE => 'Nữ',
        self::GENDER_OTHER  => 'Khác',
    ];

    // ==========================================
    // 4. NGƯỜI DÙNG & TÀI KHOẢN (USERS & STATUSES)
    // ==========================================
    // Bảng admins
    public const int ADMIN_STATUS_ACTIVE   = 1; // Đang hoạt động
    public const int ADMIN_STATUS_INACTIVE = 2; // Tạm ngưng
    public const int ADMIN_STATUS_LOCKED   = 3; // Đã khóa

    public const array ADMIN_STATUSES = [
        self::ADMIN_STATUS_ACTIVE,
        self::ADMIN_STATUS_INACTIVE,
        self::ADMIN_STATUS_LOCKED,
    ];

    public const array ADMIN_STATUS_LABELS = [
        self::ADMIN_STATUS_ACTIVE   => 'Đang hoạt động',
        self::ADMIN_STATUS_INACTIVE => 'Tạm ngưng',
        self::ADMIN_STATUS_LOCKED   => 'Đã khóa',
    ];

    // Bảng teachers
    public const int TEACHER_STATUS_ACTIVE   = 1; // Đang làm việc
    public const int TEACHER_STATUS_INACTIVE = 2; // Tạm nghỉ
    public const int TEACHER_STATUS_LOCKED   = 3; // Đã khóa

    public const array TEACHER_STATUSES = [
        self::TEACHER_STATUS_ACTIVE,
        self::TEACHER_STATUS_INACTIVE,
        self::TEACHER_STATUS_LOCKED,
    ];

    public const array TEACHER_STATUS_LABELS = [
        self::TEACHER_STATUS_ACTIVE   => 'Đang làm việc',
        self::TEACHER_STATUS_INACTIVE => 'Tạm nghỉ',
        self::TEACHER_STATUS_LOCKED   => 'Đã khóa',
    ];

    // Bảng students
    public const int STUDENT_STATUS_ACTIVE    = 1; // Đang theo học
    public const int STUDENT_STATUS_INACTIVE  = 2; // Tạm ngưng / Khóa / Nghỉ học
    public const int STUDENT_STATUS_GRADUATED = 3; // Đã tốt nghiệp

    public const array STUDENT_STATUSES = [
        self::STUDENT_STATUS_ACTIVE,
        self::STUDENT_STATUS_INACTIVE,
        self::STUDENT_STATUS_GRADUATED,
    ];

    public const array STUDENT_STATUS_LABELS = [
        self::STUDENT_STATUS_ACTIVE    => 'Đang học',
        self::STUDENT_STATUS_INACTIVE  => 'Nghỉ học',
        self::STUDENT_STATUS_GRADUATED => 'Đã tốt nghiệp',
    ];

    public const array STUDENT_STATUS_OPTIONS = [
        ['value' => self::STUDENT_STATUS_ACTIVE, 'label' => 'Đang học'],
        ['value' => self::STUDENT_STATUS_INACTIVE, 'label' => 'Nghỉ học'],
        ['value' => self::STUDENT_STATUS_GRADUATED, 'label' => 'Đã tốt nghiệp'],
    ];

    // ==========================================
    // 5. TRUNG TÂM, GÓI DỊCH VỤ & SAAS (CENTERS & PLANS)
    // ==========================================
    // Bảng centers
    public const int CENTER_STATUS_ACTIVE  = 1; // Đang hoạt động
    public const int CENTER_STATUS_PAUSED  = 2; // Tạm dừng
    public const int CENTER_STATUS_EXPIRED = 3; // Đã hết hạn

    public const array CENTER_STATUSES = [
        self::CENTER_STATUS_ACTIVE,
        self::CENTER_STATUS_PAUSED,
        self::CENTER_STATUS_EXPIRED,
    ];

    public const array CENTER_STATUS_LABELS = [
        self::CENTER_STATUS_ACTIVE  => 'Đang hoạt động',
        self::CENTER_STATUS_PAUSED  => 'Tạm dừng',
        self::CENTER_STATUS_EXPIRED => 'Đã hết hạn',
    ];

    // Bảng center_subscriptions
    public const int SUBSCRIPTION_STATUS_PENDING   = 1; // Chờ kích hoạt
    public const int SUBSCRIPTION_STATUS_ACTIVE    = 2; // Đang hiệu lực
    public const int SUBSCRIPTION_STATUS_EXPIRED   = 3; // Đã hết hạn
    public const int SUBSCRIPTION_STATUS_CANCELLED = 4; // Đã hủy

    public const array SUBSCRIPTION_STATUSES = [
        self::SUBSCRIPTION_STATUS_PENDING,
        self::SUBSCRIPTION_STATUS_ACTIVE,
        self::SUBSCRIPTION_STATUS_EXPIRED,
        self::SUBSCRIPTION_STATUS_CANCELLED,
    ];

    public const array SUBSCRIPTION_STATUS_LABELS = [
        self::SUBSCRIPTION_STATUS_PENDING   => 'Chờ kích hoạt',
        self::SUBSCRIPTION_STATUS_ACTIVE    => 'Đang hiệu lực',
        self::SUBSCRIPTION_STATUS_EXPIRED   => 'Đã hết hạn',
        self::SUBSCRIPTION_STATUS_CANCELLED => 'Đã hủy',
    ];

    // Bảng subscription_plans
    public const int PLAN_TYPE_FREE     = 1; // Gói Dùng thử / Miễn phí
    public const int PLAN_TYPE_STANDARD = 2; // Gói Tiêu chuẩn
    public const int PLAN_TYPE_PREMIUM  = 3; // Gói Nâng cao

    public const array PLAN_TYPES = [
        self::PLAN_TYPE_FREE,
        self::PLAN_TYPE_STANDARD,
        self::PLAN_TYPE_PREMIUM,
    ];

    public const array PLAN_TYPE_LABELS = [
        self::PLAN_TYPE_FREE     => 'Dùng thử 30 ngày',
        self::PLAN_TYPE_STANDARD => 'Gói Tiêu chuẩn',
        self::PLAN_TYPE_PREMIUM  => 'Gói Nâng cao',
    ];

    public const int DEFAULT_TRIAL_DAYS   = 30;
    public const int DEFAULT_MAX_CLASSES  = 10;
    public const int DEFAULT_MAX_STUDENTS = 200;

    // ==========================================
    // 6. ĐÀO TẠO, LỚP HỌC, ĐIỂM DANH (CLASSES & ATTENDANCE)
    // ==========================================
    // Bảng classes
    public const int CLASS_STATUS_ACTIVE    = 1; // Đang hoạt động
    public const int CLASS_STATUS_INACTIVE  = 2; // Tạm ngưng / Đã hủy
    public const int CLASS_STATUS_CANCELLED = 2; // Alias cho CLASS_STATUS_INACTIVE
    public const int CLASS_STATUS_COMPLETED = 3; // Đã hoàn thành
    public const int CLASS_STATUS_CLOSED    = 4; // Đã đóng

    public const array CLASS_STATUSES = [
        self::CLASS_STATUS_ACTIVE,
        self::CLASS_STATUS_INACTIVE,
        self::CLASS_STATUS_COMPLETED,
        self::CLASS_STATUS_CLOSED,
    ];

    public const array CLASS_STATUS_LABELS = [
        self::CLASS_STATUS_ACTIVE    => 'Đang hoạt động',
        self::CLASS_STATUS_INACTIVE  => 'Tạm ngưng',
        self::CLASS_STATUS_COMPLETED => 'Đã hoàn thành',
        self::CLASS_STATUS_CLOSED    => 'Đã đóng',
    ];

    // Bảng class_students
    public const int CLASS_STUDENT_STATUS_ACTIVE      = 1; // Đang học lớp này
    public const int CLASS_STUDENT_STATUS_COMPLETED   = 2; // Đã hoàn thành khóa
    public const int CLASS_STUDENT_STATUS_TRANSFERRED = 3; // Đã chuyển lớp
    public const int CLASS_STUDENT_STATUS_LEFT        = 4; // Đã thôi học / Nghỉ học

    public const array CLASS_STUDENT_STATUSES = [
        self::CLASS_STUDENT_STATUS_ACTIVE,
        self::CLASS_STUDENT_STATUS_COMPLETED,
        self::CLASS_STUDENT_STATUS_TRANSFERRED,
        self::CLASS_STUDENT_STATUS_LEFT,
    ];

    public const array CLASS_STUDENT_STATUS_LABELS = [
        self::CLASS_STUDENT_STATUS_ACTIVE      => 'Đang học',
        self::CLASS_STUDENT_STATUS_COMPLETED   => 'Đã hoàn thành',
        self::CLASS_STUDENT_STATUS_TRANSFERRED => 'Đã chuyển lớp',
        self::CLASS_STUDENT_STATUS_LEFT        => 'Đã thôi học',
    ];

    // Bảng class_subjects
    public const int CLASS_SUBJECT_STATUS_ACTIVE    = 1; // Đang phân công
    public const int CLASS_SUBJECT_STATUS_INACTIVE  = 2; // Tạm dừng
    public const int CLASS_SUBJECT_STATUS_COMPLETED = 3; // Đã hoàn thành

    public const array CLASS_SUBJECT_STATUSES = [
        self::CLASS_SUBJECT_STATUS_ACTIVE,
        self::CLASS_SUBJECT_STATUS_INACTIVE,
        self::CLASS_SUBJECT_STATUS_COMPLETED,
    ];

    public const array CLASS_SUBJECT_STATUS_LABELS = [
        self::CLASS_SUBJECT_STATUS_ACTIVE    => 'Đang phân công',
        self::CLASS_SUBJECT_STATUS_INACTIVE  => 'Tạm dừng',
        self::CLASS_SUBJECT_STATUS_COMPLETED => 'Đã hoàn thành',
    ];

    // Bảng class_schedules
    public const int SCHEDULE_STATUS_ACTIVE   = 1; // Đang áp dụng
    public const int SCHEDULE_STATUS_INACTIVE = 2; // Đã dừng

    public const array SCHEDULE_STATUSES = [
        self::SCHEDULE_STATUS_ACTIVE,
        self::SCHEDULE_STATUS_INACTIVE,
    ];

    public const array SCHEDULE_STATUS_LABELS = [
        self::SCHEDULE_STATUS_ACTIVE   => 'Đang áp dụng',
        self::SCHEDULE_STATUS_INACTIVE => 'Đã dừng',
    ];

    // Bảng class_sessions
    public const int SESSION_STATUS_SCHEDULED   = 1; // Sắp diễn ra
    public const int SESSION_STATUS_IN_PROGRESS = 2; // Đang diễn ra
    public const int SESSION_STATUS_COMPLETED   = 3; // Đã hoàn thành
    public const int SESSION_STATUS_CANCELLED   = 4; // Đã hủy / Nghỉ

    public const array SESSION_STATUSES = [
        self::SESSION_STATUS_SCHEDULED,
        self::SESSION_STATUS_IN_PROGRESS,
        self::SESSION_STATUS_COMPLETED,
        self::SESSION_STATUS_CANCELLED,
    ];

    public const array SESSION_STATUS_LABELS = [
        self::SESSION_STATUS_SCHEDULED   => 'Sắp diễn ra',
        self::SESSION_STATUS_IN_PROGRESS => 'Đang diễn ra',
        self::SESSION_STATUS_COMPLETED   => 'Đã hoàn thành',
        self::SESSION_STATUS_CANCELLED   => 'Đã hủy / Nghỉ',
    ];

    // Bảng session_reschedules
    public const int RESCHEDULE_STATUS_PENDING  = 1; // Chờ duyệt
    public const int RESCHEDULE_STATUS_APPROVED = 2; // Đã duyệt
    public const int RESCHEDULE_STATUS_REJECTED = 3; // Từ chối

    public const array RESCHEDULE_STATUSES = [
        self::RESCHEDULE_STATUS_PENDING,
        self::RESCHEDULE_STATUS_APPROVED,
        self::RESCHEDULE_STATUS_REJECTED,
    ];

    public const array RESCHEDULE_STATUS_LABELS = [
        self::RESCHEDULE_STATUS_PENDING  => 'Chờ duyệt',
        self::RESCHEDULE_STATUS_APPROVED => 'Đã duyệt',
        self::RESCHEDULE_STATUS_REJECTED => 'Từ chối',
    ];

    // Bảng attendances
    public const int ATTENDANCE_STATUS_PRESENT = 1; // Có mặt
    public const int ATTENDANCE_STATUS_ABSENT  = 2; // Vắng mặt
    public const int ATTENDANCE_STATUS_LATE    = 3; // Đi muộn
    public const int ATTENDANCE_STATUS_EXCUSED = 4; // Nghỉ có phép

    public const array ATTENDANCE_STATUSES = [
        self::ATTENDANCE_STATUS_PRESENT,
        self::ATTENDANCE_STATUS_ABSENT,
        self::ATTENDANCE_STATUS_LATE,
        self::ATTENDANCE_STATUS_EXCUSED,
    ];

    public const array ATTENDANCE_STATUS_LABELS = [
        self::ATTENDANCE_STATUS_PRESENT => 'Có mặt',
        self::ATTENDANCE_STATUS_ABSENT  => 'Vắng mặt',
        self::ATTENDANCE_STATUS_LATE    => 'Đi muộn',
        self::ATTENDANCE_STATUS_EXCUSED => 'Có phép',
    ];

    // ==========================================
    // 7. CƠ SỞ VẬT CHẤT & MÔN HỌC (ROOMS & SUBJECTS)
    // ==========================================
    // Bảng subjects
    public const int SUBJECT_STATUS_ACTIVE   = 1; // Đang giảng dạy
    public const int SUBJECT_STATUS_INACTIVE = 2; // Tạm ngưng

    public const array SUBJECT_STATUSES = [
        self::SUBJECT_STATUS_ACTIVE,
        self::SUBJECT_STATUS_INACTIVE,
    ];

    public const array SUBJECT_STATUS_LABELS = [
        self::SUBJECT_STATUS_ACTIVE   => 'Đang giảng dạy',
        self::SUBJECT_STATUS_INACTIVE => 'Tạm ngưng',
    ];

    // Bảng rooms
    public const int ROOM_STATUS_ACTIVE = 1; // Đang sử dụng
    public const int ROOM_STATUS_PAUSED = 2; // Tạm dừng
    public const int ROOM_STATUS_CLOSED = 3; // Đã đóng

    public const array ROOM_STATUSES = [
        self::ROOM_STATUS_ACTIVE,
        self::ROOM_STATUS_PAUSED,
        self::ROOM_STATUS_CLOSED,
    ];

    public const array ROOM_STATUS_LABELS = [
        self::ROOM_STATUS_ACTIVE => 'Đang hoạt động',
        self::ROOM_STATUS_PAUSED => 'Tạm dừng',
        self::ROOM_STATUS_CLOSED => 'Đã đóng',
    ];

    // Bảng room_equipments
    public const int EQUIPMENT_STATUS_GOOD        = 1; // Hoạt động tốt
    public const int EQUIPMENT_STATUS_MAINTENANCE = 2; // Đang bảo trì
    public const int EQUIPMENT_STATUS_BROKEN      = 3; // Hư hỏng

    public const array EQUIPMENT_STATUSES = [
        self::EQUIPMENT_STATUS_GOOD,
        self::EQUIPMENT_STATUS_MAINTENANCE,
        self::EQUIPMENT_STATUS_BROKEN,
    ];

    public const array EQUIPMENT_STATUS_LABELS = [
        self::EQUIPMENT_STATUS_GOOD        => 'Hoạt động tốt',
        self::EQUIPMENT_STATUS_MAINTENANCE => 'Đang bảo trì',
        self::EQUIPMENT_STATUS_BROKEN      => 'Hư hỏng',
    ];

    // ==========================================
    // 8. KHẢO THÍ & ĐỀ THI (EXAM SYSTEM)
    // ==========================================
    // Bảng exams
    public const int EXAM_STATUS_DRAFT     = 1; // Bản nháp
    public const int EXAM_STATUS_PUBLISHED = 2; // Đã xuất bản
    public const int EXAM_STATUS_COMPLETED = 3; // Đã kết thúc
    public const int EXAM_STATUS_CANCELLED = 4; // Đã hủy

    public const array EXAM_STATUSES = [
        self::EXAM_STATUS_DRAFT,
        self::EXAM_STATUS_PUBLISHED,
        self::EXAM_STATUS_COMPLETED,
        self::EXAM_STATUS_CANCELLED,
    ];

    public const array EXAM_STATUS_LABELS = [
        self::EXAM_STATUS_DRAFT     => 'Bản nháp',
        self::EXAM_STATUS_PUBLISHED => 'Đã xuất bản',
        self::EXAM_STATUS_COMPLETED => 'Đã kết thúc',
        self::EXAM_STATUS_CANCELLED => 'Đã hủy',
    ];

    // Kỹ năng thi (Skills)
    public const int SKILL_LISTENING      = 1; // Nghe
    public const int SKILL_READING        = 2; // Đọc
    public const int SKILL_WRITING        = 3; // Viết
    public const int SKILL_SPEAKING       = 4; // Nói
    public const int EXAM_SKILL_LISTENING = 1;
    public const int EXAM_SKILL_READING   = 2;
    public const int EXAM_SKILL_WRITING   = 3;
    public const int EXAM_SKILL_SPEAKING  = 4;

    public const array EXAM_SKILLS = [
        self::SKILL_LISTENING,
        self::SKILL_READING,
        self::SKILL_WRITING,
        self::SKILL_SPEAKING,
    ];

    public const array EXAM_SKILL_LABELS = [
        self::SKILL_LISTENING => 'Listening (Nghe)',
        self::SKILL_READING   => 'Reading (Đọc)',
        self::SKILL_WRITING   => 'Writing (Viết)',
        self::SKILL_SPEAKING  => 'Speaking (Nói)',
    ];

    // Dạng câu hỏi (Question Types)
    public const int QUESTION_TYPE_SINGLE_CHOICE        = 1;  // Trắc nghiệm 1 đáp án
    public const int QUESTION_TYPE_MULTIPLE_CHOICE      = 2;  // Trắc nghiệm nhiều đáp án
    public const int QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN = 3;  // Đúng / Sai / Không đề cập
    public const int QUESTION_TYPE_FILL_IN_BLANK        = 4;  // Điền vào chỗ trống
    public const int QUESTION_TYPE_DRAG_DROP_CLOZE      = 5;  // Kéo thả từ
    public const int QUESTION_TYPE_MATCHING             = 6;  // Nối cặp
    public const int QUESTION_TYPE_MATCHING_IMAGE       = 7;  // Nối hình ảnh
    public const int QUESTION_TYPE_MATCHING_SENTENCES   = 8;  // Nối câu
    public const int QUESTION_TYPE_ORDERING             = 9;  // Sắp xếp thứ tự
    public const int QUESTION_TYPE_DIAGRAM_LABELLING    = 10; // Gán nhãn sơ đồ
    public const int QUESTION_TYPE_FIND_MISTAKE         = 11; // Tìm lỗi sai
    public const int QUESTION_TYPE_ESSAY                = 12; // Tự luận / Viết bài
    public const int QUESTION_TYPE_AUDIO_RECORD         = 13; // Ghi âm giọng nói (Speaking/Oral)
    public const int QUESTION_TYPE_SHORT_ANSWER         = 14; // Trả lời ngắn
    public const int QUESTION_TYPE_ORAL                 = 15; // Vấn đáp trực tiếp

    public const array QUESTION_TYPES = [
        self::QUESTION_TYPE_SINGLE_CHOICE,
        self::QUESTION_TYPE_MULTIPLE_CHOICE,
        self::QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN,
        self::QUESTION_TYPE_FILL_IN_BLANK,
        self::QUESTION_TYPE_DRAG_DROP_CLOZE,
        self::QUESTION_TYPE_MATCHING,
        self::QUESTION_TYPE_MATCHING_IMAGE,
        self::QUESTION_TYPE_MATCHING_SENTENCES,
        self::QUESTION_TYPE_ORDERING,
        self::QUESTION_TYPE_DIAGRAM_LABELLING,
        self::QUESTION_TYPE_FIND_MISTAKE,
        self::QUESTION_TYPE_ESSAY,
        self::QUESTION_TYPE_AUDIO_RECORD,
        self::QUESTION_TYPE_SHORT_ANSWER,
        self::QUESTION_TYPE_ORAL,
    ];

    public const array QUESTION_TYPE_LABELS = [
        self::QUESTION_TYPE_SINGLE_CHOICE        => 'Trắc nghiệm 1 đáp án',
        self::QUESTION_TYPE_MULTIPLE_CHOICE      => 'Trắc nghiệm nhiều đáp án',
        self::QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN => 'Đúng / Sai / Không đề cập',
        self::QUESTION_TYPE_FILL_IN_BLANK        => 'Điền vào chỗ trống',
        self::QUESTION_TYPE_DRAG_DROP_CLOZE      => 'Kéo thả điền từ',
        self::QUESTION_TYPE_MATCHING             => 'Nối cặp',
        self::QUESTION_TYPE_MATCHING_IMAGE       => 'Nối hình ảnh',
        self::QUESTION_TYPE_MATCHING_SENTENCES   => 'Nối câu',
        self::QUESTION_TYPE_ORDERING             => 'Sắp xếp thứ tự',
        self::QUESTION_TYPE_DIAGRAM_LABELLING    => 'Gán nhãn sơ đồ',
        self::QUESTION_TYPE_FIND_MISTAKE         => 'Tìm lỗi sai',
        self::QUESTION_TYPE_ESSAY                => 'Tự luận',
        self::QUESTION_TYPE_AUDIO_RECORD         => 'Ghi âm phát âm',
        self::QUESTION_TYPE_SHORT_ANSWER         => 'Trả lời ngắn',
        self::QUESTION_TYPE_ORAL                 => 'Vấn đáp',
    ];

    // Bảng class_exams
    public const int CLASS_EXAM_STATUS_SCHEDULED = 1; // Sắp diễn ra
    public const int CLASS_EXAM_STATUS_ONGOING   = 2; // Đang mở thi
    public const int CLASS_EXAM_STATUS_COMPLETED = 3; // Đã đóng thi
    public const int CLASS_EXAM_STATUS_CANCELLED = 4; // Đã hủy

    public const array CLASS_EXAM_STATUSES = [
        self::CLASS_EXAM_STATUS_SCHEDULED,
        self::CLASS_EXAM_STATUS_ONGOING,
        self::CLASS_EXAM_STATUS_COMPLETED,
        self::CLASS_EXAM_STATUS_CANCELLED,
    ];

    public const array CLASS_EXAM_STATUS_LABELS = [
        self::CLASS_EXAM_STATUS_SCHEDULED => 'Sắp diễn ra',
        self::CLASS_EXAM_STATUS_ONGOING   => 'Đang mở thi',
        self::CLASS_EXAM_STATUS_COMPLETED => 'Đã hoàn thành',
        self::CLASS_EXAM_STATUS_CANCELLED => 'Đã hủy',
    ];

    // Bảng class_exam_submissions
    public const int SUBMISSION_STATUS_IN_PROGRESS                  = 1; // Đang làm bài
    public const int SUBMISSION_STATUS_SUBMITTED                    = 2; // Đã nộp bài
    public const int SUBMISSION_STATUS_TIMEOUT_SUBMITTED            = 3; // Hết giờ tự nộp
    public const int SUBMISSION_STATUS_MISSED                       = 4; // Bỏ thi
    public const int CLASS_EXAM_SUBMISSION_STATUS_IN_PROGRESS       = 1;
    public const int CLASS_EXAM_SUBMISSION_STATUS_SUBMITTED         = 2;
    public const int CLASS_EXAM_SUBMISSION_STATUS_TIMEOUT_SUBMITTED = 3;
    public const int CLASS_EXAM_SUBMISSION_STATUS_MISSED            = 4;

    public const array SUBMISSION_STATUSES = [
        self::SUBMISSION_STATUS_IN_PROGRESS,
        self::SUBMISSION_STATUS_SUBMITTED,
        self::SUBMISSION_STATUS_TIMEOUT_SUBMITTED,
        self::SUBMISSION_STATUS_MISSED,
    ];

    public const array SUBMISSION_STATUS_LABELS = [
        self::SUBMISSION_STATUS_IN_PROGRESS       => 'Đang làm bài',
        self::SUBMISSION_STATUS_SUBMITTED         => 'Đã nộp bài',
        self::SUBMISSION_STATUS_TIMEOUT_SUBMITTED => 'Hết giờ tự nộp',
        self::SUBMISSION_STATUS_MISSED            => 'Bỏ thi',
    ];

    // Trạng thái bộ lọc chấm điểm (Grading Filter Statuses)
    public const int GRADING_FILTER_ALL           = 0;
    public const int GRADING_FILTER_GRADED        = 1; // Đã chấm xong
    public const int GRADING_FILTER_PENDING       = 2; // Chờ chấm điểm
    public const int GRADING_FILTER_MANUAL_NEEDED = 3; // Cần chấm tự luận / nói

    public const array GRADING_FILTERS = [
        self::GRADING_FILTER_ALL,
        self::GRADING_FILTER_GRADED,
        self::GRADING_FILTER_PENDING,
        self::GRADING_FILTER_MANUAL_NEEDED,
    ];

    public const array GRADING_FILTER_LABELS = [
        self::GRADING_FILTER_GRADED        => 'Đã chấm xong',
        self::GRADING_FILTER_PENDING       => 'Chờ chấm điểm',
        self::GRADING_FILTER_MANUAL_NEEDED => 'Cần chấm tự luận / nói',
    ];

    // ==========================================
    // 9. TÀI CHÍNH, HỌC PHÍ & GIAO DỊCH (FINANCE & PAYMENTS)
    // ==========================================
    // Bảng student_tuitions
    public const int TUITION_STATUS_PENDING   = 1; // Chưa đóng
    public const int TUITION_STATUS_PAID      = 2; // Đã thanh toán đủ (Hoàn tất)
    public const int TUITION_STATUS_COMPLETED = 2; // Alias cho TUITION_STATUS_PAID
    public const int TUITION_STATUS_PARTIAL   = 3; // Đóng một phần
    public const int TUITION_STATUS_OVERDUE   = 4; // Quá hạn

    public const array TUITION_STATUSES = [
        self::TUITION_STATUS_PENDING,
        self::TUITION_STATUS_PAID,
        self::TUITION_STATUS_PARTIAL,
        self::TUITION_STATUS_OVERDUE,
    ];

    public const array TUITION_STATUS_LABELS = [
        self::TUITION_STATUS_PENDING   => 'Chưa đóng',
        self::TUITION_STATUS_PARTIAL   => 'Đóng một phần',
        self::TUITION_STATUS_PAID      => 'Đã hoàn tất',
        self::TUITION_STATUS_COMPLETED => 'Đã hoàn tất',
        self::TUITION_STATUS_OVERDUE   => 'Quá hạn',
    ];

    // Phương thức thanh toán (Payment Methods)
    public const int PAYMENT_METHOD_CASH          = 1; // Tiền mặt
    public const int PAYMENT_METHOD_BANK_TRANSFER = 2; // Chuyển khoản ngân hàng
    public const int PAYMENT_METHOD_MOMO          = 3; // Ví MoMo
    public const int PAYMENT_METHOD_ZALOPAY       = 4; // ZaloPay QR
    public const int PAYMENT_METHOD_CREDIT_CARD   = 5; // Thẻ tín dụng
    public const int PAYMENT_METHOD_OTHER         = 99; // Khác

    public const array PAYMENT_METHODS = [
        self::PAYMENT_METHOD_CASH,
        self::PAYMENT_METHOD_BANK_TRANSFER,
        self::PAYMENT_METHOD_MOMO,
        self::PAYMENT_METHOD_ZALOPAY,
        self::PAYMENT_METHOD_CREDIT_CARD,
        self::PAYMENT_METHOD_OTHER,
    ];

    public const array PAYMENT_METHOD_LABELS = [
        self::PAYMENT_METHOD_CASH          => 'Tiền mặt',
        self::PAYMENT_METHOD_BANK_TRANSFER => 'Chuyển khoản',
        self::PAYMENT_METHOD_MOMO          => 'Ví MoMo',
        self::PAYMENT_METHOD_ZALOPAY       => 'ZaloPay QR',
        self::PAYMENT_METHOD_CREDIT_CARD   => 'Thẻ tín dụng',
        self::PAYMENT_METHOD_OTHER         => 'Khác',
    ];

    // Bảng payment_transactions
    public const int PAYMENT_STATUS_PENDING  = 1; // Đang xử lý
    public const int PAYMENT_STATUS_SUCCESS  = 2; // Thành công
    public const int PAYMENT_STATUS_FAILED   = 3; // Thất bại
    public const int PAYMENT_STATUS_REFUNDED = 4; // Đã hoàn tiền

    public const array PAYMENT_STATUSES = [
        self::PAYMENT_STATUS_PENDING,
        self::PAYMENT_STATUS_SUCCESS,
        self::PAYMENT_STATUS_FAILED,
        self::PAYMENT_STATUS_REFUNDED,
    ];

    public const array PAYMENT_STATUS_LABELS = [
        self::PAYMENT_STATUS_PENDING  => 'Đang xử lý',
        self::PAYMENT_STATUS_SUCCESS  => 'Thành công',
        self::PAYMENT_STATUS_FAILED   => 'Thất bại',
        self::PAYMENT_STATUS_REFUNDED => 'Đã hoàn tiền',
    ];

    // Bảng contact_requests
    public const int CONTACT_STATUS_PENDING   = 1; // Chờ liên hệ
    public const int CONTACT_STATUS_CONTACTED = 2; // Đã liên hệ
    public const int CONTACT_STATUS_RESOLVED  = 3; // Đã xử lý xong
    public const int CONTACT_STATUS_CANCELLED = 4; // Hủy bỏ

    public const array CONTACT_STATUSES = [
        self::CONTACT_STATUS_PENDING,
        self::CONTACT_STATUS_CONTACTED,
        self::CONTACT_STATUS_RESOLVED,
        self::CONTACT_STATUS_CANCELLED,
    ];

    public const array CONTACT_STATUS_LABELS = [
        self::CONTACT_STATUS_PENDING   => 'Chờ liên hệ',
        self::CONTACT_STATUS_CONTACTED => 'Đã liên hệ',
        self::CONTACT_STATUS_RESOLVED  => 'Đã hoàn tất',
        self::CONTACT_STATUS_CANCELLED => 'Đã hủy',
    ];

    // ==========================================
    // 9B. MÃ XÁC THỰC OTP (ACCOUNT VERIFICATION OTP ACTIONS)
    // ==========================================
    public const int OTP_ACTION_CHANGE_PASSWORD  = 1;
    public const int OTP_ACTION_CHANGE_EMAIL_OLD = 2;
    public const int OTP_ACTION_CHANGE_EMAIL_NEW = 3;
    public const int OTP_ACTION_PASSWORD_RESET   = 4;

    public const array OTP_ACTIONS = [
        self::OTP_ACTION_CHANGE_PASSWORD,
        self::OTP_ACTION_CHANGE_EMAIL_OLD,
        self::OTP_ACTION_CHANGE_EMAIL_NEW,
        self::OTP_ACTION_PASSWORD_RESET,
    ];

    public const array OTP_ACTION_LABELS = [
        self::OTP_ACTION_CHANGE_PASSWORD  => 'Đổi mật khẩu tài khoản',
        self::OTP_ACTION_CHANGE_EMAIL_OLD => 'Xác thực Email cũ (Bước 1 đổi Email)',
        self::OTP_ACTION_CHANGE_EMAIL_NEW => 'Xác thực Email mới (Bước 2 đổi Email)',
        self::OTP_ACTION_PASSWORD_RESET   => 'Đặt lại mật khẩu',
    ];

    // ==========================================
    // 9C. LOẠI TÀI KHOẢN / NGƯỜI GỬI / NGƯỜI NHẬN (ACCOUNT & SENDER/RECIPIENT TYPES)
    // ==========================================
    public const int ACCOUNT_TYPE_ADMIN   = 1;
    public const int ACCOUNT_TYPE_TEACHER = 2;
    public const int ACCOUNT_TYPE_STUDENT = 3;
    public const int ACCOUNT_TYPE_CENTER  = 4;

    public const array ACCOUNT_TYPES = [
        self::ACCOUNT_TYPE_ADMIN,
        self::ACCOUNT_TYPE_TEACHER,
        self::ACCOUNT_TYPE_STUDENT,
        self::ACCOUNT_TYPE_CENTER,
    ];

    public const array ACCOUNT_TYPE_LABELS = [
        self::ACCOUNT_TYPE_ADMIN   => 'Quản trị viên',
        self::ACCOUNT_TYPE_TEACHER => 'Giáo viên',
        self::ACCOUNT_TYPE_STUDENT => 'Học sinh',
        self::ACCOUNT_TYPE_CENTER  => 'Trung tâm',
    ];

    // Chat sender types
    public const int SENDER_TYPE_ADMIN   = 1;
    public const int SENDER_TYPE_TEACHER = 2;
    public const int SENDER_TYPE_STUDENT = 3;

    public const array SENDER_TYPES = [
        self::SENDER_TYPE_ADMIN,
        self::SENDER_TYPE_TEACHER,
        self::SENDER_TYPE_STUDENT,
    ];

    // Notification recipient types
    public const int RECIPIENT_TYPE_ADMIN   = 1;
    public const int RECIPIENT_TYPE_TEACHER = 2;
    public const int RECIPIENT_TYPE_STUDENT = 3;

    public const array RECIPIENT_TYPES = [
        self::RECIPIENT_TYPE_ADMIN,
        self::RECIPIENT_TYPE_TEACHER,
        self::RECIPIENT_TYPE_STUDENT,
    ];

    // ==========================================
    // 9D. LOẠI THÔNG BÁO (NOTIFICATION TYPES)
    // ==========================================
    public const int NOTIFICATION_TYPE_GENERAL              = 1; // Hệ thống / Chung
    public const int NOTIFICATION_TYPE_TUITION              = 2; // Học phí / Thanh toán
    public const int NOTIFICATION_TYPE_EXAM                 = 3; // Khảo thí / Điểm số
    public const int NOTIFICATION_TYPE_SCHEDULE             = 4; // Lịch học / Ca học
    public const int NOTIFICATION_TYPE_ATTENDANCE           = 5; // Điểm danh
    public const int NOTIFICATION_TYPE_CENTER_REGISTRATION  = 6; // Đăng ký trung tâm mới
    public const int NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL = 7; // Yêu cầu gia hạn gói dịch vụ

    public const array NOTIFICATION_TYPES = [
        self::NOTIFICATION_TYPE_GENERAL,
        self::NOTIFICATION_TYPE_TUITION,
        self::NOTIFICATION_TYPE_EXAM,
        self::NOTIFICATION_TYPE_SCHEDULE,
        self::NOTIFICATION_TYPE_ATTENDANCE,
        self::NOTIFICATION_TYPE_CENTER_REGISTRATION,
        self::NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL,
    ];

    public const array NOTIFICATION_TYPE_LABELS = [
        self::NOTIFICATION_TYPE_GENERAL              => 'Thông báo chung',
        self::NOTIFICATION_TYPE_TUITION              => 'Học phí',
        self::NOTIFICATION_TYPE_EXAM                 => 'Khảo thí & Điểm số',
        self::NOTIFICATION_TYPE_SCHEDULE             => 'Lịch học',
        self::NOTIFICATION_TYPE_ATTENDANCE           => 'Điểm danh',
        self::NOTIFICATION_TYPE_CENTER_REGISTRATION  => 'Đăng ký trung tâm mới',
        self::NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL => 'Yêu cầu gia hạn gói dịch vụ',
    ];

    // ==========================================
    // 9E. VAI TRÒ PHÂN QUYỀN (ROLE PERMISSIONS ROLES)
    // ==========================================
    public const int ROLE_PERMISSION_SUPER_ADMIN = 1;
    public const int ROLE_PERMISSION_ADMIN       = 2;
    public const int ROLE_PERMISSION_TEACHER     = 3;
    public const int ROLE_PERMISSION_STUDENT     = 4;

    public const array ROLE_PERMISSION_ROLES = [
        self::ROLE_PERMISSION_SUPER_ADMIN,
        self::ROLE_PERMISSION_ADMIN,
        self::ROLE_PERMISSION_TEACHER,
        self::ROLE_PERMISSION_STUDENT,
    ];

    public const array ROLE_PERMISSION_ROLE_LABELS = [
        self::ROLE_PERMISSION_SUPER_ADMIN => 'Super Admin',
        self::ROLE_PERMISSION_ADMIN       => 'Admin',
        self::ROLE_PERMISSION_TEACHER     => 'Giáo viên',
        self::ROLE_PERMISSION_STUDENT     => 'Học sinh',
    ];

    // ==========================================
    // 10. THÔNG SỐ VẬN HÀNH MẶC ĐỊNH (OPERATIONAL DEFAULTS)
    // ==========================================
    public const int DEFAULT_SESSION_DURATION_MINUTES = 90;
    public const int DEFAULT_ROOM_CAPACITY            = 30;
    public const int DEFAULT_CLASS_CAPACITY           = 30;
    public const float DEFAULT_EXAM_MAX_SCORE         = 10.0;
    public const float DEFAULT_EXAM_PASS_SCORE        = 5.0;
    public const int DEFAULT_EXAM_DURATION_MINUTES    = 45;
}

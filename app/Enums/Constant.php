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
    // 1. PHÂN TRANG & HIỂN THỊ (PAGINATION)
    // ==========================================
    public const int DEFAULT_PER_PAGE   = 15;
    public const int DEFAULT_PAGE       = 1;
    public const int MAX_PER_PAGE       = 100;
    public const array PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

    // ==========================================
    // 2. TIỀN TỐ VÀ QUY TẮC SINH MÃ (CODE GENERATION)
    // ==========================================
    public const int CODE_PAD_LENGTH  = 9;
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

    public const string ACCOUNT_TYPE_ADMIN   = 'admin';
    public const string ACCOUNT_TYPE_TEACHER = 'teacher';
    public const string ACCOUNT_TYPE_STUDENT = 'student';

    public const array ACCOUNT_TYPES = [
        self::ACCOUNT_TYPE_ADMIN,
        self::ACCOUNT_TYPE_TEACHER,
        self::ACCOUNT_TYPE_STUDENT,
    ];

    public const string ROLE_SUPER_ADMIN = 'super_admin';
    public const string ROLE_ADMIN       = 'admin';

    public const array ADMIN_ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_ADMIN,
    ];

    public const int OTP_EXPIRATION_MINUTES        = 15;
    public const int OTP_DIGITS                    = 6;
    public const int REFRESH_TOKEN_EXPIRATION_DAYS = 30;

    // ==========================================
    // 4. TRẠNG THÁI SỐ NGUYÊN (TINYINT STATUSES)
    // ==========================================
    // Bảng classes
    public const int CLASS_STATUS_INACTIVE  = 0; // Tạm ngưng / Đã hủy
    public const int CLASS_STATUS_ACTIVE    = 1; // Đang hoạt động
    public const int CLASS_STATUS_COMPLETED = 2; // Đã hoàn thành

    // Bảng students
    public const int STUDENT_STATUS_INACTIVE  = 0; // Tạm ngưng / Khóa
    public const int STUDENT_STATUS_ACTIVE    = 1; // Đang theo học
    public const int STUDENT_STATUS_GRADUATED = 2; // Đã tốt nghiệp

    // ==========================================
    // 5. TRẠNG THÁI DẠNG CHUỖI (STRING ENUM STATUSES)
    // ==========================================
    // Trạng thái chung (Admins, Teachers, Subjects, Rooms, ClassSchedules)
    public const string STATUS_ACTIVE   = 'active';
    public const string STATUS_INACTIVE = 'inactive';
    public const string STATUS_LOCKED   = 'locked';

    // Bảng centers
    public const string CENTER_STATUS_ACTIVE          = 'active';
    public const string CENTER_STATUS_TRIAL           = 'trial';
    public const string CENTER_STATUS_PENDING_PAYMENT = 'pending_payment';
    public const string CENTER_STATUS_EXPIRED         = 'expired';
    public const string CENTER_STATUS_LOCKED          = 'locked';

    // Bảng room_equipments
    public const string EQUIPMENT_STATUS_GOOD        = 'good';
    public const string EQUIPMENT_STATUS_MAINTENANCE = 'maintenance';
    public const string EQUIPMENT_STATUS_BROKEN      = 'broken';

    // Bảng class_sessions
    public const string SESSION_STATUS_SCHEDULED   = 'scheduled';
    public const string SESSION_STATUS_IN_PROGRESS = 'in_progress';
    public const string SESSION_STATUS_COMPLETED   = 'completed';
    public const string SESSION_STATUS_CANCELLED   = 'cancelled';

    // Bảng class_students
    public const string CLASS_STUDENT_STATUS_ACTIVE      = 'active';
    public const string CLASS_STUDENT_STATUS_LEFT        = 'left';
    public const string CLASS_STUDENT_STATUS_COMPLETED   = 'completed';
    public const string CLASS_STUDENT_STATUS_TRANSFERRED = 'transferred';

    // Bảng class_subjects
    public const string CLASS_SUBJECT_STATUS_ACTIVE    = 'active';
    public const string CLASS_SUBJECT_STATUS_INACTIVE  = 'inactive';
    public const string CLASS_SUBJECT_STATUS_COMPLETED = 'completed';

    // Bảng attendances
    public const string ATTENDANCE_STATUS_PRESENT = 'present';
    public const string ATTENDANCE_STATUS_ABSENT  = 'absent';
    public const string ATTENDANCE_STATUS_LATE    = 'late';
    public const string ATTENDANCE_STATUS_EXCUSED = 'excused';

    // Bảng exams
    public const string EXAM_STATUS_DRAFT     = 'draft';
    public const string EXAM_STATUS_PUBLISHED = 'published';
    public const string EXAM_STATUS_COMPLETED = 'completed';
    public const string EXAM_STATUS_CANCELLED = 'cancelled';

    // Bảng class_exams
    public const string CLASS_EXAM_STATUS_SCHEDULED = 'scheduled';
    public const string CLASS_EXAM_STATUS_ONGOING   = 'ongoing';
    public const string CLASS_EXAM_STATUS_COMPLETED = 'completed';
    public const string CLASS_EXAM_STATUS_CANCELLED = 'cancelled';

    // Bảng class_exam_submissions
    public const string SUBMISSION_STATUS_IN_PROGRESS       = 'in_progress';
    public const string SUBMISSION_STATUS_SUBMITTED         = 'submitted';
    public const string SUBMISSION_STATUS_TIMEOUT_SUBMITTED = 'timeout_submitted';
    public const string SUBMISSION_STATUS_MISSED            = 'missed';

    // Bảng student_tuitions
    public const string TUITION_STATUS_PENDING   = 'pending';
    public const string TUITION_STATUS_PARTIAL   = 'partial';
    public const string TUITION_STATUS_COMPLETED = 'completed';
    public const string TUITION_STATUS_OVERDUE   = 'overdue';

    // Bảng payment_transactions
    public const string PAYMENT_STATUS_PENDING  = 'pending';
    public const string PAYMENT_STATUS_SUCCESS  = 'success';
    public const string PAYMENT_STATUS_FAILED   = 'failed';
    public const string PAYMENT_STATUS_REFUNDED = 'refunded';

    // Bảng center_subscriptions
    public const string SUBSCRIPTION_STATUS_PENDING   = 'pending';
    public const string SUBSCRIPTION_STATUS_ACTIVE    = 'active';
    public const string SUBSCRIPTION_STATUS_EXPIRED   = 'expired';
    public const string SUBSCRIPTION_STATUS_CANCELLED = 'cancelled';

    // Bảng contact_requests
    public const string CONTACT_STATUS_PENDING   = 'pending';
    public const string CONTACT_STATUS_CONTACTED = 'contacted';
    public const string CONTACT_STATUS_RESOLVED  = 'resolved';
    public const string CONTACT_STATUS_CANCELLED = 'cancelled';

    // ==========================================
    // 6. GÓI DỊCH VỤ SAAS (SUBSCRIPTIONS)
    // ==========================================
    public const string PLAN_TYPE_FREE     = 'free';
    public const string PLAN_TYPE_STANDARD = 'standard';
    public const string PLAN_TYPE_PREMIUM  = 'premium';

    public const int DEFAULT_TRIAL_DAYS   = 14;
    public const int DEFAULT_MAX_CLASSES  = 10;
    public const int DEFAULT_MAX_STUDENTS = 200;

    // ==========================================
    // 7. PHƯƠNG THỨC THANH TOÁN (PAYMENT METHODS)
    // ==========================================
    public const string PAYMENT_METHOD_CASH          = 'cash';
    public const string PAYMENT_METHOD_BANK_TRANSFER = 'bank_transfer';
    public const string PAYMENT_METHOD_MOMO          = 'momo';
    public const string PAYMENT_METHOD_ZALOPAY       = 'zalopay';
    public const string PAYMENT_METHOD_CREDIT_CARD   = 'credit_card';
    public const string PAYMENT_METHOD_OTHER         = 'other';

    public const array PAYMENT_METHODS = [
        self::PAYMENT_METHOD_CASH,
        self::PAYMENT_METHOD_BANK_TRANSFER,
        self::PAYMENT_METHOD_MOMO,
        self::PAYMENT_METHOD_ZALOPAY,
        self::PAYMENT_METHOD_CREDIT_CARD,
        self::PAYMENT_METHOD_OTHER,
    ];

    // ==========================================
    // 8. KỸ NĂNG & DẠNG CÂU HỎI THI CỬ (EXAM SYSTEM)
    // ==========================================
    public const string SKILL_LISTENING = 'listening';
    public const string SKILL_READING   = 'reading';
    public const string SKILL_WRITING   = 'writing';
    public const string SKILL_SPEAKING  = 'speaking';

    public const array EXAM_SKILLS = [
        self::SKILL_LISTENING,
        self::SKILL_READING,
        self::SKILL_WRITING,
        self::SKILL_SPEAKING,
    ];

    public const string QUESTION_TYPE_SINGLE_CHOICE        = 'single_choice';
    public const string QUESTION_TYPE_MULTIPLE_CHOICE      = 'multiple_choice';
    public const string QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN = 'true_false_not_given';
    public const string QUESTION_TYPE_FILL_IN_BLANK        = 'fill_in_blank';
    public const string QUESTION_TYPE_DRAG_DROP_CLOZE      = 'drag_drop_cloze';
    public const string QUESTION_TYPE_MATCHING             = 'matching';
    public const string QUESTION_TYPE_MATCHING_IMAGE       = 'matching_image';
    public const string QUESTION_TYPE_MATCHING_SENTENCES   = 'matching_sentences';
    public const string QUESTION_TYPE_ORDERING             = 'ordering';
    public const string QUESTION_TYPE_DIAGRAM_LABELLING    = 'diagram_labelling';
    public const string QUESTION_TYPE_FIND_MISTAKE         = 'find_mistake';
    public const string QUESTION_TYPE_ESSAY                = 'essay';
    public const string QUESTION_TYPE_AUDIO_RECORD         = 'audio_record';
    public const string QUESTION_TYPE_SHORT_ANSWER         = 'short_answer';
    public const string QUESTION_TYPE_ORAL                 = 'oral';

    // ==========================================
    // 9. THÔNG SỐ VẬN HÀNH MẶC ĐỊNH (OPERATIONAL DEFAULTS)
    // ==========================================
    public const int DEFAULT_SESSION_DURATION_MINUTES = 90;
    public const int DEFAULT_ROOM_CAPACITY            = 30;
    public const int DEFAULT_CLASS_CAPACITY           = 30;
    public const float DEFAULT_EXAM_MAX_SCORE         = 10.0;
    public const float DEFAULT_EXAM_PASS_SCORE        = 5.0;
    public const int DEFAULT_EXAM_DURATION_MINUTES    = 45;
}

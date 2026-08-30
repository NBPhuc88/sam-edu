/**
 * Hệ thống Constants & Enums chuẩn hóa toàn hệ thống Sam Edu
 * Ánh xạ 1-1 với backend App\Enums\Constant.php
 */

// ==========================================
// 0. TRẠNG THÁI TOÀN CỤC CHUNG (GENERIC STATUSES)
// ==========================================
export const STATUS_ACTIVE = 1; // Đang hoạt động / Bật / Hoạt động
export const STATUS_INACTIVE = 2; // Không hoạt động / Tắt / Khóa / Tạm dừng

// ==========================================
// 1. PHÂN TRANG & HIỂN THỊ (PAGINATION)
// ==========================================
export const DEFAULT_PER_PAGE = 15;
export const DEFAULT_PAGE = 1;
export const MAX_PER_PAGE = 100;
export const PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

// ==========================================
// 3. AUTHENTICATION, GUARDS & PHÂN QUYỀN (ROLES)
// ==========================================
export const GUARD_ADMIN = 'admin';
export const GUARD_TEACHER = 'teacher';
export const GUARD_STUDENT = 'student';

export const ROLE_SUPER_ADMIN = 1;
export const ROLE_ADMIN = 2;
export const ROLE_TEACHER = 3;
export const ROLE_STUDENT = 4;
export const ADMIN_ROLE_SUPER_ADMIN = 1;
export const ADMIN_ROLE_ADMIN = 2;

export const ADMIN_ROLE_LABELS: Record<number, string> = {
    [ROLE_SUPER_ADMIN]: 'Super Admin',
    [ROLE_ADMIN]: 'Admin Quản trị',
};

// Giới tính (Gender)
export const GENDER_MALE = 1;
export const GENDER_FEMALE = 2;
export const GENDER_OTHER = 3;

export const GENDER_LABELS: Record<number, string> = {
    [GENDER_MALE]: 'Nam',
    [GENDER_FEMALE]: 'Nữ',
    [GENDER_OTHER]: 'Khác',
};

export const GENDER_OPTIONS = [
    { value: GENDER_MALE, label: 'Nam' },
    { value: GENDER_FEMALE, label: 'Nữ' },
    { value: GENDER_OTHER, label: 'Khác' },
];

// ==========================================
// 4. NGƯỜI DÙNG & TÀI KHOẢN (USERS & STATUSES)
// ==========================================
// Bảng admins
export const ADMIN_STATUS_ACTIVE = 1; // Đang hoạt động
export const ADMIN_STATUS_INACTIVE = 2; // Tạm ngưng
export const ADMIN_STATUS_LOCKED = 3; // Đã khóa

export const ADMIN_STATUS_LABELS: Record<number, string> = {
    [ADMIN_STATUS_ACTIVE]: 'Đang hoạt động',
    [ADMIN_STATUS_INACTIVE]: 'Tạm ngưng',
    [ADMIN_STATUS_LOCKED]: 'Đã khóa',
};

// Bảng teachers
export const TEACHER_STATUS_ACTIVE = 1; // Đang làm việc
export const TEACHER_STATUS_INACTIVE = 2; // Tạm nghỉ
export const TEACHER_STATUS_LOCKED = 3; // Đã khóa

export const TEACHER_STATUS_LABELS: Record<number, string> = {
    [TEACHER_STATUS_ACTIVE]: 'Đang làm việc',
    [TEACHER_STATUS_INACTIVE]: 'Tạm nghỉ',
    [TEACHER_STATUS_LOCKED]: 'Đã khóa',
};

// Bảng students
export const STUDENT_STATUS_ACTIVE = 1; // Đang theo học
export const STUDENT_STATUS_INACTIVE = 2; // Tạm ngưng / Nghỉ học
export const STUDENT_STATUS_GRADUATED = 3; // Đã tốt nghiệp

export const STUDENT_STATUS_LABELS: Record<number, string> = {
    [STUDENT_STATUS_ACTIVE]: 'Đang học',
    [STUDENT_STATUS_INACTIVE]: 'Nghỉ học',
    [STUDENT_STATUS_GRADUATED]: 'Đã tốt nghiệp',
};

export const STUDENT_STATUS_OPTIONS = [
    { value: STUDENT_STATUS_ACTIVE, label: 'Đang học' },
    { value: STUDENT_STATUS_INACTIVE, label: 'Nghỉ học' },
    { value: STUDENT_STATUS_GRADUATED, label: 'Đã tốt nghiệp' },
];

// ==========================================
// 5. TRUNG TÂM, GÓI DỊCH VỤ & SAAS (CENTERS & PLANS)
// ==========================================
// Bảng centers
export const CENTER_STATUS_ACTIVE = 1; // Đang hoạt động
export const CENTER_STATUS_PAUSED = 2; // Tạm dừng
export const CENTER_STATUS_EXPIRED = 3; // Đã hết hạn

export const CENTER_STATUS_LABELS: Record<number, string> = {
    [CENTER_STATUS_ACTIVE]: 'Đang hoạt động',
    [CENTER_STATUS_PAUSED]: 'Tạm dừng',
    [CENTER_STATUS_EXPIRED]: 'Đã hết hạn',
};

export const CENTER_STATUS_OPTIONS = [
    { value: CENTER_STATUS_ACTIVE, label: 'Đang hoạt động' },
    { value: CENTER_STATUS_PAUSED, label: 'Tạm dừng' },
    { value: CENTER_STATUS_EXPIRED, label: 'Đã hết hạn' },
];

// Bảng center_subscriptions
export const SUBSCRIPTION_STATUS_PENDING = 1; // Chờ kích hoạt
export const SUBSCRIPTION_STATUS_ACTIVE = 2; // Đang hiệu lực
export const SUBSCRIPTION_STATUS_EXPIRED = 3; // Đã hết hạn
export const SUBSCRIPTION_STATUS_CANCELLED = 4; // Đã hủy

export const SUBSCRIPTION_STATUS_LABELS: Record<number, string> = {
    [SUBSCRIPTION_STATUS_PENDING]: 'Chờ kích hoạt',
    [SUBSCRIPTION_STATUS_ACTIVE]: 'Đang hiệu lực',
    [SUBSCRIPTION_STATUS_EXPIRED]: 'Đã hết hạn',
    [SUBSCRIPTION_STATUS_CANCELLED]: 'Đã hủy',
};

// Bảng subscription_plans
export const PLAN_TYPE_FREE = 1; // Gói Dùng thử / Miễn phí
export const PLAN_TYPE_STANDARD = 2; // Gói Tiêu chuẩn
export const PLAN_TYPE_PREMIUM = 3; // Gói Nâng cao

export const PLAN_TYPE_LABELS: Record<number, string> = {
    [PLAN_TYPE_FREE]: 'Dùng thử 30 ngày',
    [PLAN_TYPE_STANDARD]: 'Gói Tiêu chuẩn',
    [PLAN_TYPE_PREMIUM]: 'Gói Nâng cao',
};

// ==========================================
// 6. ĐÀO TẠO, LỚP HỌC, ĐIỂM DANH (CLASSES & ATTENDANCE)
// ==========================================
// Bảng classes
export const CLASS_STATUS_ACTIVE = 1; // Đang hoạt động
export const CLASS_STATUS_INACTIVE = 2; // Tạm ngưng / Đã hủy
export const CLASS_STATUS_CANCELLED = 2;
export const CLASS_STATUS_COMPLETED = 3; // Đã hoàn thành
export const CLASS_STATUS_CLOSED = 4; // Đã đóng

export const CLASS_STATUS_LABELS: Record<number, string> = {
    [CLASS_STATUS_ACTIVE]: 'Đang hoạt động',
    [CLASS_STATUS_INACTIVE]: 'Tạm ngưng',
    [CLASS_STATUS_COMPLETED]: 'Đã hoàn thành',
    [CLASS_STATUS_CLOSED]: 'Đã đóng',
};

// Bảng class_students
export const CLASS_STUDENT_STATUS_ACTIVE = 1; // Đang học lớp này
export const CLASS_STUDENT_STATUS_COMPLETED = 2; // Đã hoàn thành khóa
export const CLASS_STUDENT_STATUS_TRANSFERRED = 3; // Đã chuyển lớp
export const CLASS_STUDENT_STATUS_LEFT = 4; // Đã thôi học / Nghỉ học

export const CLASS_STUDENT_STATUS_LABELS: Record<number, string> = {
    [CLASS_STUDENT_STATUS_ACTIVE]: 'Đang học',
    [CLASS_STUDENT_STATUS_COMPLETED]: 'Đã hoàn thành',
    [CLASS_STUDENT_STATUS_TRANSFERRED]: 'Đã chuyển lớp',
    [CLASS_STUDENT_STATUS_LEFT]: 'Đã thôi học',
};

// Bảng class_subjects
export const CLASS_SUBJECT_STATUS_ACTIVE = 1; // Đang phân công
export const CLASS_SUBJECT_STATUS_INACTIVE = 2; // Tạm dừng
export const CLASS_SUBJECT_STATUS_COMPLETED = 3; // Đã hoàn thành

export const CLASS_SUBJECT_STATUS_LABELS: Record<number, string> = {
    [CLASS_SUBJECT_STATUS_ACTIVE]: 'Đang phân công',
    [CLASS_SUBJECT_STATUS_INACTIVE]: 'Tạm dừng',
    [CLASS_SUBJECT_STATUS_COMPLETED]: 'Đã hoàn thành',
};

// Bảng class_schedules
export const SCHEDULE_STATUS_ACTIVE = 1; // Đang áp dụng
export const SCHEDULE_STATUS_INACTIVE = 2; // Đã dừng

export const SCHEDULE_STATUS_LABELS: Record<number, string> = {
    [SCHEDULE_STATUS_ACTIVE]: 'Đang áp dụng',
    [SCHEDULE_STATUS_INACTIVE]: 'Đã dừng',
};

// Bảng class_sessions
export const SESSION_STATUS_SCHEDULED = 1; // Sắp diễn ra
export const SESSION_STATUS_IN_PROGRESS = 2; // Đang diễn ra
export const SESSION_STATUS_COMPLETED = 3; // Đã hoàn thành
export const SESSION_STATUS_CANCELLED = 4; // Đã hủy / Nghỉ

export const SESSION_STATUS_LABELS: Record<number, string> = {
    [SESSION_STATUS_SCHEDULED]: 'Sắp diễn ra',
    [SESSION_STATUS_IN_PROGRESS]: 'Đang diễn ra',
    [SESSION_STATUS_COMPLETED]: 'Đã hoàn thành',
    [SESSION_STATUS_CANCELLED]: 'Đã hủy / Nghỉ',
};

// Bảng session_reschedules
export const RESCHEDULE_STATUS_PENDING = 1; // Chờ duyệt
export const RESCHEDULE_STATUS_APPROVED = 2; // Đã duyệt
export const RESCHEDULE_STATUS_REJECTED = 3; // Từ chối

export const RESCHEDULE_STATUS_LABELS: Record<number, string> = {
    [RESCHEDULE_STATUS_PENDING]: 'Chờ duyệt',
    [RESCHEDULE_STATUS_APPROVED]: 'Đã duyệt',
    [RESCHEDULE_STATUS_REJECTED]: 'Từ chối',
};

// Bảng attendances
export const ATTENDANCE_STATUS_PRESENT = 1; // Có mặt
export const ATTENDANCE_STATUS_ABSENT = 2; // Vắng mặt
export const ATTENDANCE_STATUS_LATE = 3; // Đi muộn
export const ATTENDANCE_STATUS_EXCUSED = 4; // Nghỉ có phép

export const ATTENDANCE_STATUS_LABELS: Record<number, string> = {
    [ATTENDANCE_STATUS_PRESENT]: 'Có mặt',
    [ATTENDANCE_STATUS_ABSENT]: 'Vắng mặt',
    [ATTENDANCE_STATUS_LATE]: 'Đi muộn',
    [ATTENDANCE_STATUS_EXCUSED]: 'Có phép',
};

// ==========================================
// 7. CƠ SỞ VẬT CHẤT & MÔN HỌC (ROOMS & SUBJECTS)
// ==========================================
// Bảng subjects
export const SUBJECT_STATUS_ACTIVE = 1; // Đang giảng dạy
export const SUBJECT_STATUS_INACTIVE = 2; // Tạm ngưng

export const SUBJECT_STATUS_LABELS: Record<number, string> = {
    [SUBJECT_STATUS_ACTIVE]: 'Đang giảng dạy',
    [SUBJECT_STATUS_INACTIVE]: 'Tạm ngưng',
};

// Bảng rooms
export const ROOM_STATUS_ACTIVE = 1; // Đang sử dụng
export const ROOM_STATUS_PAUSED = 2; // Tạm dừng
export const ROOM_STATUS_CLOSED = 3; // Đã đóng

export const ROOM_STATUS_LABELS: Record<number, string> = {
    [ROOM_STATUS_ACTIVE]: 'Đang hoạt động',
    [ROOM_STATUS_PAUSED]: 'Tạm dừng',
    [ROOM_STATUS_CLOSED]: 'Đã đóng',
};

// Bảng room_equipments
export const EQUIPMENT_STATUS_GOOD = 1; // Hoạt động tốt
export const EQUIPMENT_STATUS_MAINTENANCE = 2; // Đang bảo trì
export const EQUIPMENT_STATUS_BROKEN = 3; // Hư hỏng

export const EQUIPMENT_STATUS_LABELS: Record<number, string> = {
    [EQUIPMENT_STATUS_GOOD]: 'Hoạt động tốt',
    [EQUIPMENT_STATUS_MAINTENANCE]: 'Đang bảo trì',
    [EQUIPMENT_STATUS_BROKEN]: 'Hư hỏng',
};

// ==========================================
// 8. KHẢO THÍ & ĐỀ THI (EXAM SYSTEM)
// ==========================================
// Bảng exams
export const EXAM_STATUS_DRAFT = 1; // Bản nháp
export const EXAM_STATUS_PUBLISHED = 2; // Đã xuất bản
export const EXAM_STATUS_COMPLETED = 3; // Đã kết thúc
export const EXAM_STATUS_CANCELLED = 4; // Đã hủy

export const EXAM_STATUS_LABELS: Record<number, string> = {
    [EXAM_STATUS_DRAFT]: 'Bản nháp',
    [EXAM_STATUS_PUBLISHED]: 'Đã xuất bản',
    [EXAM_STATUS_COMPLETED]: 'Đã kết thúc',
    [EXAM_STATUS_CANCELLED]: 'Đã hủy',
};

// Kỹ năng thi (Skills)
export const SKILL_LISTENING = 1; // Nghe
export const SKILL_READING = 2; // Đọc
export const SKILL_WRITING = 3; // Viết
export const SKILL_SPEAKING = 4; // Nói

export const EXAM_SKILL_LABELS: Record<number, string> = {
    [SKILL_LISTENING]: 'Listening (Nghe)',
    [SKILL_READING]: 'Reading (Đọc)',
    [SKILL_WRITING]: 'Writing (Viết)',
    [SKILL_SPEAKING]: 'Speaking (Nói)',
};

// Dạng câu hỏi (Question Types)
export const QUESTION_TYPE_SINGLE_CHOICE = 1; // Trắc nghiệm 1 đáp án
export const QUESTION_TYPE_MULTIPLE_CHOICE = 2; // Trắc nghiệm nhiều đáp án
export const QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN = 3; // Đúng / Sai / Không đề cập
export const QUESTION_TYPE_FILL_IN_BLANK = 4; // Điền vào chỗ trống
export const QUESTION_TYPE_DRAG_DROP_CLOZE = 5; // Kéo thả từ
export const QUESTION_TYPE_MATCHING = 6; // Nối cặp
export const QUESTION_TYPE_MATCHING_IMAGE = 7; // Nối hình ảnh
export const QUESTION_TYPE_MATCHING_SENTENCES = 8; // Nối câu
export const QUESTION_TYPE_ORDERING = 9; // Sắp xếp thứ tự
export const QUESTION_TYPE_DIAGRAM_LABELLING = 10; // Gán nhãn sơ đồ
export const QUESTION_TYPE_FIND_MISTAKE = 11; // Tìm lỗi sai
export const QUESTION_TYPE_ESSAY = 12; // Tự luận / Viết bài
export const QUESTION_TYPE_AUDIO_RECORD = 13; // Ghi âm giọng nói (Speaking/Oral)
export const QUESTION_TYPE_SHORT_ANSWER = 14; // Trả lời ngắn
export const QUESTION_TYPE_ORAL = 15; // Vấn đáp trực tiếp

export const QUESTION_TYPE_LABELS: Record<number, string> = {
    [QUESTION_TYPE_SINGLE_CHOICE]: 'Trắc nghiệm 1 đáp án',
    [QUESTION_TYPE_MULTIPLE_CHOICE]: 'Trắc nghiệm nhiều đáp án',
    [QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN]: 'Đúng / Sai / Không đề cập',
    [QUESTION_TYPE_FILL_IN_BLANK]: 'Điền vào chỗ trống',
    [QUESTION_TYPE_DRAG_DROP_CLOZE]: 'Kéo thả điền từ',
    [QUESTION_TYPE_MATCHING]: 'Nối cặp',
    [QUESTION_TYPE_MATCHING_IMAGE]: 'Nối hình ảnh',
    [QUESTION_TYPE_MATCHING_SENTENCES]: 'Nối câu',
    [QUESTION_TYPE_ORDERING]: 'Sắp xếp thứ tự',
    [QUESTION_TYPE_DIAGRAM_LABELLING]: 'Gán nhãn sơ đồ',
    [QUESTION_TYPE_FIND_MISTAKE]: 'Tìm lỗi sai',
    [QUESTION_TYPE_ESSAY]: 'Tự luận',
    [QUESTION_TYPE_AUDIO_RECORD]: 'Ghi âm phát âm',
    [QUESTION_TYPE_SHORT_ANSWER]: 'Trả lời ngắn',
    [QUESTION_TYPE_ORAL]: 'Vấn đáp',
};

// Bảng class_exams
export const CLASS_EXAM_STATUS_SCHEDULED = 1; // Sắp diễn ra
export const CLASS_EXAM_STATUS_ONGOING = 2; // Đang mở thi
export const CLASS_EXAM_STATUS_COMPLETED = 3; // Đã đóng thi
export const CLASS_EXAM_STATUS_CANCELLED = 4; // Đã hủy

export const CLASS_EXAM_STATUS_LABELS: Record<number, string> = {
    [CLASS_EXAM_STATUS_SCHEDULED]: 'Sắp diễn ra',
    [CLASS_EXAM_STATUS_ONGOING]: 'Đang mở thi',
    [CLASS_EXAM_STATUS_COMPLETED]: 'Đã hoàn thành',
    [CLASS_EXAM_STATUS_CANCELLED]: 'Đã hủy',
};

// Bảng class_exam_submissions
export const SUBMISSION_STATUS_IN_PROGRESS = 1; // Đang làm bài
export const SUBMISSION_STATUS_SUBMITTED = 2; // Đã nộp bài
export const SUBMISSION_STATUS_TIMEOUT_SUBMITTED = 3; // Hết giờ tự nộp
export const SUBMISSION_STATUS_MISSED = 4; // Bỏ thi

export const SUBMISSION_STATUS_LABELS: Record<number, string> = {
    [SUBMISSION_STATUS_IN_PROGRESS]: 'Đang làm bài',
    [SUBMISSION_STATUS_SUBMITTED]: 'Đã nộp bài',
    [SUBMISSION_STATUS_TIMEOUT_SUBMITTED]: 'Hết giờ tự nộp',
    [SUBMISSION_STATUS_MISSED]: 'Bỏ thi',
};

// ==========================================
// 9. TÀI CHÍNH, HỌC PHÍ & GIAO DỊCH (FINANCE & PAYMENTS)
// ==========================================
// Bảng student_tuitions
export const TUITION_STATUS_PENDING = 1; // Chưa đóng
export const TUITION_STATUS_PAID = 2; // Đã thanh toán đủ (Hoàn tất)
export const TUITION_STATUS_COMPLETED = 2; // Alias
export const TUITION_STATUS_PARTIAL = 3; // Đóng một phần
export const TUITION_STATUS_OVERDUE = 4; // Quá hạn

export const TUITION_STATUS_LABELS: Record<number, string> = {
    [TUITION_STATUS_PENDING]: 'Chưa đóng',
    [TUITION_STATUS_PARTIAL]: 'Đóng một phần',
    [TUITION_STATUS_PAID]: 'Đã hoàn tất',
    [TUITION_STATUS_OVERDUE]: 'Quá hạn',
};

// Phương thức thanh toán (Payment Methods)
export const PAYMENT_METHOD_CASH = 1; // Tiền mặt
export const PAYMENT_METHOD_BANK_TRANSFER = 2; // Chuyển khoản ngân hàng
export const PAYMENT_METHOD_MOMO = 3; // Ví MoMo
export const PAYMENT_METHOD_ZALOPAY = 4; // ZaloPay QR
export const PAYMENT_METHOD_CREDIT_CARD = 5; // Thẻ tín dụng
export const PAYMENT_METHOD_OTHER = 99; // Khác

export const PAYMENT_METHOD_LABELS: Record<number, string> = {
    [PAYMENT_METHOD_CASH]: 'Tiền mặt',
    [PAYMENT_METHOD_BANK_TRANSFER]: 'Chuyển khoản',
    [PAYMENT_METHOD_MOMO]: 'Ví MoMo',
    [PAYMENT_METHOD_ZALOPAY]: 'ZaloPay QR',
    [PAYMENT_METHOD_CREDIT_CARD]: 'Thẻ tín dụng',
    [PAYMENT_METHOD_OTHER]: 'Khác',
};

export const PAYMENT_METHOD_OPTIONS = [
    { value: PAYMENT_METHOD_CASH, label: 'Tiền mặt' },
    { value: PAYMENT_METHOD_BANK_TRANSFER, label: 'Chuyển khoản' },
    { value: PAYMENT_METHOD_MOMO, label: 'Ví MoMo' },
    { value: PAYMENT_METHOD_ZALOPAY, label: 'ZaloPay QR' },
    { value: PAYMENT_METHOD_CREDIT_CARD, label: 'Thẻ tín dụng' },
    { value: PAYMENT_METHOD_OTHER, label: 'Khác' },
];

// Bảng payment_transactions
export const PAYMENT_STATUS_PENDING = 1; // Đang xử lý
export const PAYMENT_STATUS_SUCCESS = 2; // Thành công
export const PAYMENT_STATUS_FAILED = 3; // Thất bại
export const PAYMENT_STATUS_REFUNDED = 4; // Đã hoàn tiền

export const PAYMENT_STATUS_LABELS: Record<number, string> = {
    [PAYMENT_STATUS_PENDING]: 'Đang xử lý',
    [PAYMENT_STATUS_SUCCESS]: 'Thành công',
    [PAYMENT_STATUS_FAILED]: 'Thất bại',
    [PAYMENT_STATUS_REFUNDED]: 'Đã hoàn tiền',
};

// Bảng contact_requests
export const CONTACT_STATUS_PENDING = 1; // Chờ liên hệ
export const CONTACT_STATUS_CONTACTED = 2; // Đã liên hệ
export const CONTACT_STATUS_RESOLVED = 3; // Đã xử lý xong
export const CONTACT_STATUS_CANCELLED = 4; // Hủy bỏ

export const CONTACT_STATUS_LABELS: Record<number, string> = {
    [CONTACT_STATUS_PENDING]: 'Chờ liên hệ',
    [CONTACT_STATUS_CONTACTED]: 'Đã liên hệ',
    [CONTACT_STATUS_RESOLVED]: 'Đã hoàn tất',
    [CONTACT_STATUS_CANCELLED]: 'Đã hủy',
};

// ==========================================
// 9B. MÃ XÁC THỰC OTP
// ==========================================
export const OTP_ACTION_CHANGE_PASSWORD = 1;
export const OTP_ACTION_CHANGE_EMAIL_OLD = 2;
export const OTP_ACTION_CHANGE_EMAIL_NEW = 3;
export const OTP_ACTION_PASSWORD_RESET = 4;

// ==========================================
// 9C. LOẠI TÀI KHOẢN / NGƯỜI GỬI / NGƯỜI NHẬN
// ==========================================
export const ACCOUNT_TYPE_ADMIN = 1;
export const ACCOUNT_TYPE_TEACHER = 2;
export const ACCOUNT_TYPE_STUDENT = 3;
export const ACCOUNT_TYPE_CENTER = 4;

export const ACCOUNT_TYPE_LABELS: Record<number, string> = {
    [ACCOUNT_TYPE_ADMIN]: 'Quản trị viên',
    [ACCOUNT_TYPE_TEACHER]: 'Giáo viên',
    [ACCOUNT_TYPE_STUDENT]: 'Học sinh',
    [ACCOUNT_TYPE_CENTER]: 'Trung tâm',
};

// Chat sender types
export const SENDER_TYPE_ADMIN = 1;
export const SENDER_TYPE_TEACHER = 2;
export const SENDER_TYPE_STUDENT = 3;

export const SENDER_TYPE_LABELS: Record<number, string> = {
    [SENDER_TYPE_ADMIN]: 'Quản trị viên',
    [SENDER_TYPE_TEACHER]: 'Giáo viên',
    [SENDER_TYPE_STUDENT]: 'Học sinh',
};

// Notification recipient types
export const RECIPIENT_TYPE_ADMIN = 1;
export const RECIPIENT_TYPE_TEACHER = 2;
export const RECIPIENT_TYPE_STUDENT = 3;

// ==========================================
// 9D. LOẠI THÔNG BÁO (NOTIFICATION TYPES)
// ==========================================
export const NOTIFICATION_TYPE_GENERAL = 1; // Hệ thống / Chung
export const NOTIFICATION_TYPE_TUITION = 2; // Học phí / Thanh toán
export const NOTIFICATION_TYPE_EXAM = 3; // Khảo thí / Điểm số
export const NOTIFICATION_TYPE_SCHEDULE = 4; // Lịch học / Ca học
export const NOTIFICATION_TYPE_ATTENDANCE = 5; // Điểm danh

export const NOTIFICATION_TYPE_LABELS: Record<number, string> = {
    [NOTIFICATION_TYPE_GENERAL]: 'Thông báo chung',
    [NOTIFICATION_TYPE_TUITION]: 'Học phí',
    [NOTIFICATION_TYPE_EXAM]: 'Khảo thí & Điểm số',
    [NOTIFICATION_TYPE_SCHEDULE]: 'Lịch học',
    [NOTIFICATION_TYPE_ATTENDANCE]: 'Điểm danh',
};

// ==========================================
// 9E. VAI TRÒ PHÂN QUYỀN (ROLE PERMISSIONS ROLES)
// ==========================================
export const ROLE_PERMISSION_SUPER_ADMIN = 1;
export const ROLE_PERMISSION_ADMIN = 2;
export const ROLE_PERMISSION_TEACHER = 3;
export const ROLE_PERMISSION_STUDENT = 4;

export const ROLE_PERMISSION_ROLES = [
    ROLE_PERMISSION_SUPER_ADMIN,
    ROLE_PERMISSION_ADMIN,
    ROLE_PERMISSION_TEACHER,
    ROLE_PERMISSION_STUDENT,
];

export const ROLE_PERMISSION_ROLE_LABELS: Record<number, string> = {
    [ROLE_PERMISSION_SUPER_ADMIN]: 'Super Admin',
    [ROLE_PERMISSION_ADMIN]: 'Admin',
    [ROLE_PERMISSION_TEACHER]: 'Giáo viên',
    [ROLE_PERMISSION_STUDENT]: 'Học sinh',
};


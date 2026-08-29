# Bảng Quy Chuẩn Trạng Thái Cơ Sở Dữ Liệu (Database Numeric Constants Conventions) - Sam Edu

Tài liệu này tổng hợp và quy định chi tiết tất cả các giá trị trạng thái (`status`), vai trò (`role`), phương thức (`payment_method`), kỹ năng (`skill`), dạng câu hỏi (`question_type`), loại tài khoản (`account_type`), loại thông báo (`type`), hành động OTP (`action`), giới tính (`gender`) dạng số nguyên (`TINYINT UNSIGNED`) trong cơ sở dữ liệu hệ thống **sam-edu**, đồng bộ tuyệt đối với migration `2026_08_29_000002_convert_fixed_values_to_numeric_constants.php` và class hằng số [`app/Enums/Constant.php`](file:///home/phuc/Desktop/web/projects/demo/app/Enums/Constant.php).

---

## 1. Lưu Ý Quan Trọng Về Kiểu Dữ Liệu (Data Type Rules)

> [!IMPORTANT]
> **Tất cả các trường trạng thái và giá trị phân loại cố định sử dụng số nguyên `TINYINT UNSIGNED`**:
> - Toàn bộ hằng số được định nghĩa tập trung tại [`app/Enums/Constant.php`](file:///home/phuc/Desktop/web/projects/demo/app/Enums/Constant.php).
> - Khi viết truy vấn Backend (Eloquent / QueryBuilder), **bắt buộc so sánh bằng số nguyên hoặc hằng số `Constant::...`** (ví dụ: `->where('status', Constant::CLASS_STATUS_ACTIVE)`).
> - **Tuyệt đối không so sánh bằng chuỗi** như `where('status', 'active')` để tránh lỗi so sánh kiểu MySQL làm mất dữ liệu hoặc sai lệch kết quả truy vấn.
> - **Trong Form Request Validation**: Luôn sử dụng `Rule::in(Constant::...)` hoặc mảng hằng số tương ứng thay vì danh sách chuỗi `'in:active,inactive'`.

---

## 2. Chi Tiết Giá Trị Số Theo Từng Bảng

### A. Người Dùng & Phân Quyền (Users & Auth)

| Tên Bảng | Tên Cột | Kiểu Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị / Ý Nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`admins`** | `role` | `TINYINT UNSIGNED` | **`1`**<br>**`2`** | `ROLE_SUPER_ADMIN`<br>`ROLE_ADMIN` | Super Admin (Quản trị tối cao)<br>Admin Quản trị (Admin chi nhánh) |
| | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`0`**<br>**`2`** | `ADMIN_STATUS_ACTIVE`<br>`ADMIN_STATUS_INACTIVE`<br>`ADMIN_STATUS_LOCKED` | Đang hoạt động<br>Tạm ngưng<br>Đã khóa |
| **`teachers`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`0`**<br>**`2`** | `TEACHER_STATUS_ACTIVE`<br>`TEACHER_STATUS_INACTIVE`<br>`TEACHER_STATUS_LOCKED` | Đang làm việc<br>Tạm nghỉ<br>Đã khóa |
| | `gender` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`** | `GENDER_MALE`<br>`GENDER_FEMALE`<br>`GENDER_OTHER` | Nam<br>Nữ<br>Khác |
| **`students`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`0`**<br>**`2`** | `STUDENT_STATUS_ACTIVE`<br>`STUDENT_STATUS_INACTIVE`<br>`STUDENT_STATUS_GRADUATED` | Đang theo học<br>Nghỉ học / Khóa<br>Đã tốt nghiệp |
| | `gender` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`** | `GENDER_MALE`<br>`GENDER_FEMALE`<br>`GENDER_OTHER` | Nam<br>Nữ<br>Khác |

---

### B. Trung Tâm, Gói Dịch Vụ SaaS (Centers & Subscriptions)

| Tên Bảng | Tên Cột | Kiểu Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị / Ý Nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`centers`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`** | `CENTER_STATUS_ACTIVE`<br>`CENTER_STATUS_PAUSED`<br>`CENTER_STATUS_EXPIRED` | Đang hoạt động<br>Tạm dừng<br>Đã hết hạn |
| | `subscription_plan_id` | `BIGINT UNSIGNED` | `id` | Khóa ngoại | Tham chiếu `subscription_plans.id` (ID của gói dịch vụ) |
| | `plan_type` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`** | `PLAN_TYPE_FREE`<br>`PLAN_TYPE_STANDARD`<br>`PLAN_TYPE_PREMIUM` | Gói Dùng thử / Miễn phí<br>Gói Tiêu chuẩn<br>Gói Nâng cao |
| **`subscription_plans`** | `plan_type` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`** | `PLAN_TYPE_FREE`<br>`PLAN_TYPE_STANDARD`<br>`PLAN_TYPE_PREMIUM` | Gói Dùng thử 30 ngày<br>Gói Tiêu chuẩn<br>Gói Nâng cao |
| **`center_subscriptions`** | `plan_id` | `BIGINT UNSIGNED` | `id` | Khóa ngoại | Tham chiếu `subscription_plans.id` |
| | `status` | `TINYINT UNSIGNED` | **`0`**<br>**`1`**<br>**`2`**<br>**`3`** | `SUBSCRIPTION_STATUS_PENDING`<br>`SUBSCRIPTION_STATUS_ACTIVE`<br>`SUBSCRIPTION_STATUS_EXPIRED`<br>`SUBSCRIPTION_STATUS_CANCELLED` | Chờ kích hoạt<br>Đang hiệu lực<br>Đã hết hạn<br>Đã hủy |

---

### C. Quản Lý Đào Tạo & Lớp Học (Classes & Attendance)

| Tên Bảng | Tên Cột | Kiểu Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị / Ý Nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`classes`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`0`**<br>**`2`**<br>**`3`** | `CLASS_STATUS_ACTIVE`<br>`CLASS_STATUS_INACTIVE`<br>`CLASS_STATUS_COMPLETED`<br>`CLASS_STATUS_CLOSED` | Đang hoạt động<br>Tạm ngưng / Hủy<br>Đã hoàn thành<br>Đã đóng |
| **`class_students`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`0`** | `CLASS_STUDENT_STATUS_ACTIVE`<br>`CLASS_STUDENT_STATUS_COMPLETED`<br>`CLASS_STUDENT_STATUS_TRANSFERRED`<br>`CLASS_STUDENT_STATUS_LEFT` | Đang học lớp này<br>Đã hoàn thành khóa<br>Đã chuyển lớp<br>Đã thôi học |
| **`class_subjects`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`0`**<br>**`2`** | `CLASS_SUBJECT_STATUS_ACTIVE`<br>`CLASS_SUBJECT_STATUS_INACTIVE`<br>`CLASS_SUBJECT_STATUS_COMPLETED` | Đang phân công<br>Tạm dừng<br>Đã hoàn thành |
| **`class_schedules`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`0`** | `SCHEDULE_STATUS_ACTIVE`<br>`SCHEDULE_STATUS_INACTIVE` | Đang áp dụng<br>Đã dừng |
| **`class_sessions`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`0`** | `SESSION_STATUS_SCHEDULED`<br>`SESSION_STATUS_IN_PROGRESS`<br>`SESSION_STATUS_COMPLETED`<br>`SESSION_STATUS_CANCELLED` | Sắp diễn ra<br>Đang diễn ra<br>Đã hoàn thành<br>Đã hủy / Nghỉ |
| **`session_reschedules`** | `status` | `TINYINT UNSIGNED` | **`0`**<br>**`1`**<br>**`2`** | `RESCHEDULE_STATUS_PENDING`<br>`RESCHEDULE_STATUS_APPROVED`<br>`RESCHEDULE_STATUS_REJECTED` | Chờ duyệt<br>Đã duyệt<br>Từ chối |
| **`attendances`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`** | `ATTENDANCE_STATUS_PRESENT`<br>`ATTENDANCE_STATUS_ABSENT`<br>`ATTENDANCE_STATUS_LATE`<br>`ATTENDANCE_STATUS_EXCUSED` | Có mặt<br>Vắng mặt<br>Đi muộn<br>Có phép |

---

### D. Cơ Sở Vật Chất & Môn Học (Facilities & Subjects)

| Tên Bảng | Tên Cột | Kiểu Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị / Ý Nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`subjects`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`0`** | `SUBJECT_STATUS_ACTIVE`<br>`SUBJECT_STATUS_INACTIVE` | Đang giảng dạy<br>Tạm ngưng |
| **`center_subjects`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`0`** | `STATUS_ACTIVE`<br>`STATUS_INACTIVE` | Đang áp dụng<br>Tạm dừng |
| **`rooms`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`0`**<br>**`2`** | `ROOM_STATUS_ACTIVE`<br>`ROOM_STATUS_PAUSED`<br>`ROOM_STATUS_CLOSED` | Đang sử dụng<br>Tạm dừng<br>Đã đóng |
| **`room_equipments`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`** | `EQUIPMENT_STATUS_GOOD`<br>`EQUIPMENT_STATUS_MAINTENANCE`<br>`EQUIPMENT_STATUS_BROKEN` | Hoạt động tốt<br>Đang bảo trì<br>Hư hỏng |

---

### E. Khảo Thí & Đề Thi (Exam System)

| Tên Bảng | Tên Cột | Kiểu Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị / Ý Nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`exams`** | `status` | `TINYINT UNSIGNED` | **`0`**<br>**`1`**<br>**`2`**<br>**`3`** | `EXAM_STATUS_DRAFT`<br>`EXAM_STATUS_PUBLISHED`<br>`EXAM_STATUS_COMPLETED`<br>`EXAM_STATUS_CANCELLED` | Bản nháp<br>Đã xuất bản<br>Đã kết thúc<br>Đã hủy |
| | `skill` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`** | `SKILL_LISTENING`<br>`SKILL_READING`<br>`SKILL_WRITING`<br>`SKILL_SPEAKING` | Listening (Nghe)<br>Reading (Đọc)<br>Writing (Viết)<br>Speaking (Nói) |
| **`exam_sections`** | `skill` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`** | `SKILL_LISTENING`<br>`SKILL_READING`<br>`SKILL_WRITING`<br>`SKILL_SPEAKING` | Nghe<br>Đọc<br>Viết<br>Nói |
| **`exam_questions`** | `question_type` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`**<br>**`5`**<br>**`6`**<br>**`7`**<br>**`8`**<br>**`9`**<br>**`10`**<br>**`11`**<br>**`12`**<br>**`13`**<br>**`14`**<br>**`15`** | `QUESTION_TYPE_SINGLE_CHOICE`<br>`QUESTION_TYPE_MULTIPLE_CHOICE`<br>`QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN`<br>`QUESTION_TYPE_FILL_IN_BLANK`<br>`QUESTION_TYPE_DRAG_DROP_CLOZE`<br>`QUESTION_TYPE_MATCHING`<br>`QUESTION_TYPE_MATCHING_IMAGE`<br>`QUESTION_TYPE_MATCHING_SENTENCES`<br>`QUESTION_TYPE_ORDERING`<br>`QUESTION_TYPE_DIAGRAM_LABELLING`<br>`QUESTION_TYPE_FIND_MISTAKE`<br>`QUESTION_TYPE_ESSAY`<br>`QUESTION_TYPE_AUDIO_RECORD`<br>`QUESTION_TYPE_SHORT_ANSWER`<br>`QUESTION_TYPE_ORAL` | Trắc nghiệm 1 đáp án<br>Trắc nghiệm nhiều đáp án<br>Đúng / Sai / Không đề cập<br>Điền vào chỗ trống<br>Kéo thả điền từ<br>Nối cặp<br>Nối hình ảnh<br>Nối câu<br>Sắp xếp thứ tự<br>Gán nhãn sơ đồ<br>Tìm lỗi sai<br>Tự luận<br>Ghi âm phát âm<br>Trả lời ngắn<br>Vấn đáp trực tiếp |
| | `skill` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`** | `SKILL_LISTENING`<br>`SKILL_READING`<br>`SKILL_WRITING`<br>`SKILL_SPEAKING` | Nghe<br>Đọc<br>Viết<br>Nói |
| **`class_exams`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`0`** | `CLASS_EXAM_STATUS_SCHEDULED`<br>`CLASS_EXAM_STATUS_ONGOING`<br>`CLASS_EXAM_STATUS_COMPLETED`<br>`CLASS_EXAM_STATUS_CANCELLED` | Sắp diễn ra<br>Đang mở thi<br>Đã hoàn thành<br>Đã hủy |
| **`class_exam_submissions`** | `status` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`0`** | `SUBMISSION_STATUS_IN_PROGRESS`<br>`SUBMISSION_STATUS_SUBMITTED`<br>`SUBMISSION_STATUS_TIMEOUT_SUBMITTED`<br>`SUBMISSION_STATUS_MISSED` | Đang làm bài<br>Đã nộp bài<br>Hết giờ tự nộp<br>Bỏ thi |

---

### F. Tài Chính, Học Phí & Giao Dịch (Finance & Payments)

| Tên Bảng | Tên Cột | Kiểu Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị / Ý Nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`student_tuitions`** | `status` | `TINYINT UNSIGNED` | **`0`**<br>**`1`**<br>**`2`**<br>**`3`** | `TUITION_STATUS_PENDING`<br>`TUITION_STATUS_PAID` / `TUITION_STATUS_COMPLETED`<br>`TUITION_STATUS_PARTIAL`<br>`TUITION_STATUS_OVERDUE` | Chưa đóng<br>Đã hoàn tất<br>Đóng một phần<br>Quá hạn |
| **`tuition_payments`** | `payment_method` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`**<br>**`5`**<br>**`99`** | `PAYMENT_METHOD_CASH`<br>`PAYMENT_METHOD_BANK_TRANSFER`<br>`PAYMENT_METHOD_MOMO`<br>`PAYMENT_METHOD_ZALOPAY`<br>`PAYMENT_METHOD_CREDIT_CARD`<br>`PAYMENT_METHOD_OTHER` | Tiền mặt<br>Chuyển khoản<br>Ví MoMo<br>ZaloPay QR<br>Thẻ tín dụng<br>Khác |
| **`payment_transactions`** | `status` | `TINYINT UNSIGNED` | **`0`**<br>**`1`**<br>**`2`**<br>**`3`** | `PAYMENT_STATUS_PENDING`<br>`PAYMENT_STATUS_SUCCESS`<br>`PAYMENT_STATUS_FAILED`<br>`PAYMENT_STATUS_REFUNDED` | Đang xử lý<br>Thành công<br>Thất bại<br>Đã hoàn tiền |
| | `payment_method` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`**<br>**`5`**<br>**`99`** | `PAYMENT_METHOD_CASH`<br>`PAYMENT_METHOD_BANK_TRANSFER`<br>`PAYMENT_METHOD_MOMO`<br>`PAYMENT_METHOD_ZALOPAY`<br>`PAYMENT_METHOD_CREDIT_CARD`<br>`PAYMENT_METHOD_OTHER` | Tiền mặt<br>Chuyển khoản<br>Ví MoMo<br>ZaloPay QR<br>Thẻ tín dụng<br>Khác |
| **`contact_requests`** | `status` | `TINYINT UNSIGNED` | **`0`**<br>**`1`**<br>**`2`**<br>**`3`** | `CONTACT_STATUS_PENDING`<br>`CONTACT_STATUS_CONTACTED`<br>`CONTACT_STATUS_RESOLVED`<br>`CONTACT_STATUS_CANCELLED` | Chờ liên hệ<br>Đã liên hệ<br>Đã hoàn tất<br>Đã hủy |

---

### G. Mã OTP & Xác Thực (Account OTPs & Verification)

| Tên Bảng | Tên Cột | Kiểu Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị / Ý Nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`account_verification_otps`** | `action` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`** | `OTP_ACTION_CHANGE_PASSWORD`<br>`OTP_ACTION_CHANGE_EMAIL_OLD`<br>`OTP_ACTION_CHANGE_EMAIL_NEW`<br>`OTP_ACTION_PASSWORD_RESET` | Đổi mật khẩu tài khoản<br>Xác thực Email cũ (Bước 1)<br>Xác thực Email mới (Bước 2)<br>Đặt lại mật khẩu |
| **`password_reset_otps`** | `account_type` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`** | `ACCOUNT_TYPE_ADMIN`<br>`ACCOUNT_TYPE_TEACHER`<br>`ACCOUNT_TYPE_STUDENT`<br>`ACCOUNT_TYPE_CENTER` | Quản trị viên<br>Giáo viên<br>Học sinh<br>Trung tâm |

---

### H. Nhóm Chat & Thông Báo (Chat & Notifications)

| Tên Bảng | Tên Cột | Kiểu Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị / Ý Nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`class_chat_messages`** | `sender_type` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`** | `SENDER_TYPE_ADMIN`<br>`SENDER_TYPE_TEACHER`<br>`SENDER_TYPE_STUDENT` | Quản trị viên<br>Giáo viên<br>Học sinh |
| **`class_chat_message_reactions`** | `sender_type` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`** | `SENDER_TYPE_ADMIN`<br>`SENDER_TYPE_TEACHER`<br>`SENDER_TYPE_STUDENT` | Quản trị viên<br>Giáo viên<br>Học sinh |
| **`notifications`** | `type` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`**<br>**`5`** | `NOTIFICATION_TYPE_GENERAL`<br>`NOTIFICATION_TYPE_TUITION`<br>`NOTIFICATION_TYPE_EXAM`<br>`NOTIFICATION_TYPE_SCHEDULE`<br>`NOTIFICATION_TYPE_ATTENDANCE` | Thông báo chung<br>Học phí<br>Khảo thí & Điểm số<br>Lịch học<br>Điểm danh |
| **`notification_recipients`** | `recipient_type` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`** | `RECIPIENT_TYPE_ADMIN`<br>`RECIPIENT_TYPE_TEACHER`<br>`RECIPIENT_TYPE_STUDENT` | Quản trị viên<br>Giáo viên<br>Học sinh |

---

### I. Vai Trò Phân Quyền (Role Permissions)

| Tên Bảng | Tên Cột | Kiểu Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị / Ý Nghĩa |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`role_permissions`** | `role` | `TINYINT UNSIGNED` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`** | `ROLE_PERMISSION_SUPER_ADMIN`<br>`ROLE_PERMISSION_ADMIN`<br>`ROLE_PERMISSION_TEACHER`<br>`ROLE_PERMISSION_STUDENT` | Super Admin<br>Admin<br>Giáo viên<br>Học sinh |

---

## 3. Mẹo Viết Code Backend & Frontend

### Backend (PHP / Laravel)
```php
use App\Enums\Constant;
use Illuminate\Validation\Rule;

// Truy vấn cơ sở dữ liệu:
$activeClasses = SchoolClass::where('status', Constant::CLASS_STATUS_ACTIVE)->get();

// Form Request Validation:
public function rules(): array
{
    return [
        'status' => ['required', 'integer', Rule::in(Constant::CLASS_STATUSES)],
        'gender' => ['nullable', 'integer', Rule::in(Constant::GENDERS)],
    ];
}
```

### Frontend (TypeScript / React)
```typescript
// Sử dụng trực tiếp giá trị số hoặc hằng số tương ứng:
const isActive = student.status === 1; // Constant.STUDENT_STATUS_ACTIVE
```

# Bảng Quy Chuẩn Trạng Thái Cơ Sở Dữ Liệu (Database Numeric Constants Conventions) - Sam Edu

Tài liệu này tổng hợp và quy định chi tiết tất cả các giá trị trạng thái (`status`), vai trò (`role`), phương thức (`payment_method`), kỹ năng (`skill`), giới tính (`gender`) dạng số nguyên (`TINYINT UNSIGNED`) trong cơ sở dữ liệu hệ thống **sam-edu**, phục vụ việc truy vấn, hiển thị và phát triển tính năng.

---

## 1. Lưu Ý Quan Trọng Về Kiểu Dữ Liệu (Data Type Rules)

> [!IMPORTANT]
> **Tất cả các trường trạng thái và giá trị cố định sử dụng số nguyên `TINYINT UNSIGNED`**:
> - Toàn bộ hằng số được định nghĩa tập trung tại [`app/Enums/Constant.php`](file:///home/phuc/Desktop/php/projects/sam-edu/app/Enums/Constant.php).
> - Khi viết truy vấn Backend (Eloquent / QueryBuilder), **bắt buộc so sánh bằng số nguyên hoặc hằng số `Constant::...`** (ví dụ: `->where('status', Constant::CLASS_STATUS_ACTIVE)`).
> - **Tuyệt đối không so sánh bằng chuỗi** như `where('status', 'active')` để tránh lỗi so sánh kiểu MySQL làm mất dữ liệu.

---

## 2. Chi Tiết Trạng Thái Theo Từng Bảng

### A. Người Dùng & Phân Quyền (Users & Auth)

| Tên Bảng | Tên Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị |
| :--- | :--- | :---: | :--- | :--- |
| **`admins`** | `role` | **`1`**<br>**`2`** | `ROLE_SUPER_ADMIN`<br>`ROLE_ADMIN` | Super Admin<br>Admin phụ |
| | `status` | **`1`**<br>**`0`**<br>**`2`** | `ADMIN_STATUS_ACTIVE`<br>`ADMIN_STATUS_INACTIVE`<br>`ADMIN_STATUS_LOCKED` | Đang hoạt động<br>Tạm ngưng<br>Đã khóa |
| **`teachers`** | `status` | **`1`**<br>**`0`**<br>**`2`** | `TEACHER_STATUS_ACTIVE`<br>`TEACHER_STATUS_INACTIVE`<br>`TEACHER_STATUS_LOCKED` | Đang làm việc<br>Tạm nghỉ<br>Đã khóa |
| **`students`** | `status` | **`1`**<br>**`0`**<br>**`2`** | `STUDENT_STATUS_ACTIVE`<br>`STUDENT_STATUS_INACTIVE`<br>`STUDENT_STATUS_GRADUATED` | Đang theo học<br>Nghỉ học<br>Đã tốt nghiệp |
| | `gender` | **`1`**<br>**`2`**<br>**`3`** | `GENDER_MALE`<br>`GENDER_FEMALE`<br>`GENDER_OTHER` | Nam<br>Nữ<br>Khác |

---

### B. Trung Tâm, Gói Dịch Vụ & SaaS (Centers & Subscriptions)

| Tên Bảng | Tên Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị |
| :--- | :--- | :---: | :--- | :--- |
| **`centers`** | `status` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`**<br>**`0`** | `CENTER_STATUS_ACTIVE`<br>`CENTER_STATUS_TRIAL`<br>`CENTER_STATUS_PENDING_PAYMENT`<br>`CENTER_STATUS_EXPIRED`<br>`CENTER_STATUS_LOCKED` | Đang hoạt động<br>Dùng thử<br>Chờ thanh toán<br>Hết hạn<br>Bị khóa |
| **`center_subscriptions`** | `status` | **`0`**<br>**`1`**<br>**`2`**<br>**`3`** | `SUBSCRIPTION_STATUS_PENDING`<br>`SUBSCRIPTION_STATUS_ACTIVE`<br>`SUBSCRIPTION_STATUS_EXPIRED`<br>`SUBSCRIPTION_STATUS_CANCELLED` | Chờ kích hoạt<br>Đang hiệu lực<br>Đã hết hạn<br>Đã hủy |
| **`subscription_plans`** | `plan_type` | **`1`**<br>**`2`**<br>**`3`** | `PLAN_TYPE_FREE`<br>`PLAN_TYPE_STANDARD`<br>`PLAN_TYPE_PREMIUM` | Gói Dùng thử/Miễn phí<br>Gói Tiêu chuẩn<br>Gói Nâng cao |

---

### C. Quản Lý Đào Tạo & Lớp Học (Classes & Attendance)

| Tên Bảng | Tên Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị |
| :--- | :--- | :---: | :--- | :--- |
| **`classes`** | `status` | **`1`**<br>**`0`**<br>**`2`**<br>**`3`** | `CLASS_STATUS_ACTIVE`<br>`CLASS_STATUS_INACTIVE`<br>`CLASS_STATUS_COMPLETED`<br>`CLASS_STATUS_CLOSED` | Đang hoạt động<br>Tạm ngưng<br>Đã hoàn thành<br>Đã đóng |
| **`class_students`** | `status` | **`1`**<br>**`2`**<br>**`3`**<br>**`0`** | `CLASS_STUDENT_STATUS_ACTIVE`<br>`CLASS_STUDENT_STATUS_COMPLETED`<br>`CLASS_STUDENT_STATUS_TRANSFERRED`<br>`CLASS_STUDENT_STATUS_LEFT` | Đang học lớp này<br>Đã hoàn thành khóa<br>Đã chuyển lớp<br>Đã thôi học |
| **`class_subjects`** | `status` | **`1`**<br>**`0`**<br>**`2`** | `CLASS_SUBJECT_STATUS_ACTIVE`<br>`CLASS_SUBJECT_STATUS_INACTIVE`<br>`CLASS_SUBJECT_STATUS_COMPLETED` | Đang phân công<br>Tạm dừng<br>Đã hoàn thành |
| **`class_schedules`** | `status` | **`1`**<br>**`0`** | `SCHEDULE_STATUS_ACTIVE`<br>`SCHEDULE_STATUS_INACTIVE` | Đang áp dụng<br>Đã dừng |
| **`class_sessions`** | `status` | **`1`**<br>**`2`**<br>**`3`**<br>**`0`** | `SESSION_STATUS_SCHEDULED`<br>`SESSION_STATUS_IN_PROGRESS`<br>`SESSION_STATUS_COMPLETED`<br>`SESSION_STATUS_CANCELLED` | Sắp diễn ra<br>Đang diễn ra<br>Đã hoàn thành<br>Đã hủy / Nghỉ |
| **`session_reschedules`** | `status` | **`0`**<br>**`1`**<br>**`2`** | `RESCHEDULE_STATUS_PENDING`<br>`RESCHEDULE_STATUS_APPROVED`<br>`RESCHEDULE_STATUS_REJECTED` | Chờ duyệt<br>Đã duyệt<br>Từ chối |
| **`attendances`** | `status` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`** | `ATTENDANCE_STATUS_PRESENT`<br>`ATTENDANCE_STATUS_ABSENT`<br>`ATTENDANCE_STATUS_LATE`<br>`ATTENDANCE_STATUS_EXCUSED` | Có mặt<br>Vắng mặt<br>Đi muộn<br>Có phép |

---

### D. Cơ Sở Vật Chất & Môn Học (Facilities & Subjects)

| Tên Bảng | Tên Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị |
| :--- | :--- | :---: | :--- | :--- |
| **`subjects`** | `status` | **`1`**<br>**`0`** | `SUBJECT_STATUS_ACTIVE`<br>`SUBJECT_STATUS_INACTIVE` | Đang giảng dạy<br>Tạm ngưng |
| **`rooms`** | `status` | **`1`**<br>**`0`**<br>**`2`** | `ROOM_STATUS_ACTIVE`<br>`ROOM_STATUS_PAUSED`<br>`ROOM_STATUS_CLOSED` | Đang sử dụng<br>Tạm dừng<br>Đã đóng |
| **`room_equipments`** | `status` | **`1`**<br>**`2`**<br>**`3`** | `EQUIPMENT_STATUS_GOOD`<br>`EQUIPMENT_STATUS_MAINTENANCE`<br>`EQUIPMENT_STATUS_BROKEN` | Hoạt động tốt<br>Đang bảo trì<br>Hư hỏng |

---

### E. Khảo Thí & Thi Cử (Exams)

| Tên Bảng | Tên Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị |
| :--- | :--- | :---: | :--- | :--- |
| **`exams`** | `status` | **`0`**<br>**`1`**<br>**`2`**<br>**`3`** | `EXAM_STATUS_DRAFT`<br>`EXAM_STATUS_PUBLISHED`<br>`EXAM_STATUS_COMPLETED`<br>`EXAM_STATUS_CANCELLED` | Bản nháp<br>Đã xuất bản<br>Đã kết thúc<br>Đã hủy |
| | `skill` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`** | `SKILL_LISTENING`<br>`SKILL_READING`<br>`SKILL_WRITING`<br>`SKILL_SPEAKING` | Nghe (Listening)<br>Đọc (Reading)<br>Viết (Writing)<br>Nói (Speaking) |
| **`class_exams`** | `status` | **`1`**<br>**`2`**<br>**`3`**<br>**`0`** | `CLASS_EXAM_STATUS_SCHEDULED`<br>`CLASS_EXAM_STATUS_ONGOING`<br>`CLASS_EXAM_STATUS_COMPLETED`<br>`CLASS_EXAM_STATUS_CANCELLED` | Sắp diễn ra<br>Đang mở thi<br>Đã đóng thi<br>Đã hủy |
| **`class_exam_submissions`** | `status` | **`1`**<br>**`2`**<br>**`3`**<br>**`0`** | `SUBMISSION_STATUS_IN_PROGRESS`<br>`SUBMISSION_STATUS_SUBMITTED`<br>`SUBMISSION_STATUS_TIMEOUT_SUBMITTED`<br>`SUBMISSION_STATUS_MISSED` | Đang làm bài<br>Đã nộp bài<br>Hết giờ tự nộp<br>Bỏ thi |

---

### F. Tài Chính, Học Phí & SaaS (Finance & Payments)

| Tên Bảng | Tên Cột | Giá Trị Số | Hằng Số `Constant.php` | Tên Hiển Thị |
| :--- | :--- | :---: | :--- | :--- |
| **`student_tuitions`** | `status` | **`0`**<br>**`1`**<br>**`2`**<br>**`3`** | `TUITION_STATUS_PENDING`<br>`TUITION_STATUS_COMPLETED`<br>`TUITION_STATUS_PARTIAL`<br>`TUITION_STATUS_OVERDUE` | Chưa đóng<br>Đã hoàn tất<br>Đóng một phần<br>Quá hạn |
| **`tuition_payments`** / **`payment_transactions`** | `payment_method` | **`1`**<br>**`2`**<br>**`3`**<br>**`4`**<br>**`5`**<br>**`99`** | `PAYMENT_METHOD_CASH`<br>`PAYMENT_METHOD_BANK_TRANSFER`<br>`PAYMENT_METHOD_MOMO`<br>`PAYMENT_METHOD_ZALOPAY`<br>`PAYMENT_METHOD_CREDIT_CARD`<br>`PAYMENT_METHOD_OTHER` | Tiền mặt<br>Chuyển khoản<br>Ví MoMo<br>ZaloPay QR<br>Thẻ tín dụng<br>Khác |
| **`payment_transactions`** | `status` | **`0`**<br>**`1`**<br>**`2`**<br>**`3`** | `PAYMENT_STATUS_PENDING`<br>`PAYMENT_STATUS_SUCCESS`<br>`PAYMENT_STATUS_FAILED`<br>`PAYMENT_STATUS_REFUNDED` | Đang xử lý<br>Thành công<br>Thất bại<br>Đã hoàn tiền |
| **`contact_requests`** | `status` | **`0`**<br>**`1`**<br>**`2`**<br>**`3`** | `CONTACT_STATUS_PENDING`<br>`CONTACT_STATUS_CONTACTED`<br>`CONTACT_STATUS_RESOLVED`<br>`CONTACT_STATUS_CANCELLED` | Chờ liên hệ<br>Đã liên hệ<br>Đã xử lý xong<br>Hủy bỏ |

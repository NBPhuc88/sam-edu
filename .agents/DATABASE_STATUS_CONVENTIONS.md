# Bảng Quy Chuẩn Trạng Thái Cơ Sở Dữ Liệu (Database Status Conventions) - Sam Edu

Tài liệu này tổng hợp và quy định chi tiết tất cả các giá trị trạng thái (`status`) của các bảng trong cơ sở dữ liệu hệ thống **sam-edu**, phục vụ việc truy vấn, hiển thị và phát triển tính năng.

---

## 1. Lưu Ý Quan Trọng Về Kiểu Dữ Liệu (Data Type Rules)

> [!WARNING]
> **Hai bảng sử dụng số nguyên `tinyint` cho `status`**:
> - **`classes`**: `0` = Inactive, `1` = Active, `2` = Completed.
> - **`students`**: `0` = Inactive, `1` = Active, `2` = Graduated.
> 
> Khi viết truy vấn Eloquent / QueryBuilder trên 2 bảng này, **bắt buộc dùng số nguyên** (`->where('status', 1)` hoặc `->whereIn('status', [1, 2])`), **tuyệt đối không dùng chuỗi** `where('status', 'active')` vì MySQL sẽ so sánh kiểu không khớp và trả về 0 kết quả.

---

## 2. Chi Tiết Trạng Thái Theo Từng Bảng

### A. Quản Lý Đào Tạo & Lớp Học

| Tên Bảng | Kiểu Cột | Giá Trị | Tên Hiển Thị | Ý Nghĩa Chi Tiết |
| :--- | :---: | :---: | :--- | :--- |
| **`classes`** | `tinyint` | **`0`** | Tạm ngưng / Đã hủy | Lớp học không hoạt động hoặc bị hủy |
| | | **`1`** | Đang hoạt động | Lớp đang mở, đang trong tiến trình giảng dạy |
| | | **`2`** | Đã hoàn thành | Lớp đã kết thúc toàn bộ chương trình học |
| **`class_sessions`** | `enum` | **`scheduled`** | Sắp diễn ra | Ca học dự kiến theo đúng lịch |
| | | **`in_progress`** | Đang diễn ra | Ca học đang trong khung giờ học |
| | | **`completed`** | Đã hoàn thành | Ca học đã diễn ra và hoàn tất điểm danh |
| | | **`cancelled`** | Đã hủy / Nghỉ | Ca học bị hủy hoặc nghỉ lễ |
| **`class_students`** | `enum` | **`active`** | Đang theo học | Học sinh đang học tập trong lớp |
| | | **`left`** | Đã nghỉ học | Học sinh đã xin thôi học / rút khỏi lớp |
| | | **`completed`** | Đã hoàn thành | Học sinh đã hoàn thành khóa học |
| | | **`transferred`** | Đã chuyển lớp | Học sinh đã chuyển sang lớp khác |
| **`class_subjects`** | `enum` | **`active`** | Đang phân công | Môn học và giáo viên đang phụ trách lớp |
| | | **`inactive`** | Tạm dừng | Tạm dừng phân công |
| | | **`completed`** | Đã hoàn thành | Môn học trong lớp đã hoàn tất |
| **`class_schedules`** | `enum` | **`active`** | Đang áp dụng | Khung lịch học cố định hàng tuần đang có hiệu lực |
| | | **`inactive`** | Đã dừng | Khung lịch học đã dừng áp dụng |
| **`attendances`** | `enum` | **`present`** | Có mặt | Học sinh đi học đầy đủ |
| | | **`absent`** | Vắng mặt | Học sinh vắng không phép |
| | | **`late`** | Đi muộn | Học sinh đến muộn |
| | | **`excused`** | Có phép | Học sinh xin nghỉ có phép |

---

### B. Người Dùng & Cơ Sở Vật Chất

| Tên Bảng | Kiểu Cột | Giá Trị | Tên Hiển Thị | Ý Nghĩa Chi Tiết |
| :--- | :---: | :---: | :--- | :--- |
| **`students`** | `tinyint` | **`0`** | Tạm ngưng / Khóa | Tài khoản học sinh bị tạm dừng hoặc khóa |
| | | **`1`** | Đang theo học | Học sinh đang hoạt động bình thường |
| | | **`2`** | Đã tốt nghiệp | Học sinh đã hoàn thành toàn bộ chương trình |
| **`teachers`** | `enum` | **`active`** | Đang làm việc | Giáo viên đang công tác tại trung tâm |
| | | **`inactive`** | Tạm nghỉ | Giáo viên tạm ngưng công tác |
| | | **`locked`** | Đã khóa | Tài khoản giáo viên bị khóa |
| **`admins`** | `enum` | **`active`** | Đang hoạt động | Tài khoản Quản trị viên hoạt động bình thường |
| | | **`inactive`** | Tạm ngưng | Tài khoản tạm ngưng |
| | | **`locked`** | Đã khóa | Tài khoản bị vô hiệu hóa |
| **`centers`** | `varchar` | **`active`** | Đang hoạt động | Trung tâm đang hoạt động và có gói dịch vụ |
| | | **`trial`** | Dùng thử | Trung tâm trong thời gian dùng thử 14 ngày |
| | | **`pending_payment`** | Chờ thanh toán | Trung tâm chờ thanh toán gia hạn |
| | | **`expired`** | Hết hạn | Trung tâm đã hết hạn gói dịch vụ |
| | | **`locked`** | Bị khóa | Trung tâm bị khóa |
| **`subjects`** | `enum` | **`active`** | Đang giảng dạy | Môn học đang mở cho các lớp đăng ký |
| | | **`inactive`** | Tạm ngưng | Môn học tạm đóng |
| **`rooms`** | `enum` | **`active`** | Đang sử dụng | Phòng học sẵn sàng xếp lịch |
| | | **`inactive`** | Tạm đóng | Phòng học đang sửa chữa hoặc không dùng |
| **`room_equipments`** | `enum` | **`good`** | Hoạt động tốt | Thiết bị trong phòng hoạt động bình thường |
| | | **`maintenance`** | Đang bảo trì | Thiết bị đang sửa chữa / bảo trì |
| | | **`broken`** | Hư hỏng | Thiết bị bị hỏng cần thay mới |

---

### C. Khảo Thí & Thi Cử

| Tên Bảng | Kiểu Cột | Giá Trị | Tên Hiển Thị | Ý Nghĩa Chi Tiết |
| :--- | :---: | :---: | :--- | :--- |
| **`exams`** | `enum` | **`draft`** | Bản nháp | Đề thi đang soạn thảo, chưa xuất bản |
| | | **`published`** | Đã xuất bản | Đề thi đã hoàn thiện, sẵn sàng giao lớp |
| | | **`completed`** | Đã kết thúc | Kỳ thi đã hoàn thành |
| | | **`cancelled`** | Đã hủy | Đề thi / kỳ thi bị hủy |
| **`class_exams`** | `enum` | **`scheduled`** | Sắp diễn ra | Bài thi đã giao cho lớp, chưa đến giờ mở |
| | | **`ongoing`** | Đang mở thi | Bài thi đang trong thời gian học sinh làm bài |
| | | **`completed`** | Đã đóng thi | Đã hết giờ thi, chờ chấm điểm / xem kết quả |
| | | **`cancelled`** | Đã hủy | Hủy bài thi cho lớp này |
| **`class_exam_submissions`** | `enum` | **`in_progress`** | Đang làm bài | Học sinh đang trong phòng thi thực hiện bài làm |
| | | **`submitted`** | Đã nộp bài | Học sinh chủ động bấm nộp bài |
| | | **`timeout_submitted`** | Hết giờ tự nộp | Hệ thống tự động thu bài khi hết giờ |
| | | **`missed`** | Bỏ thi | Học sinh không tham gia bài thi |

---

### D. Tài Chính, Học Phí & SaaS

| Tên Bảng | Kiểu Cột | Giá Trị | Tên Hiển Thị | Ý Nghĩa Chi Tiết |
| :--- | :---: | :---: | :--- | :--- |
| **`student_tuitions`** | `enum` | **`pending`** | Chưa đóng | Học sinh chưa thanh toán khoản học phí |
| | | **`partial`** | Đóng một phần | Đã đóng 1 phần, còn nợ học phí còn lại |
| | | **`completed`** | Đã hoàn tất | Đã đóng đủ 100% học phí |
| | | **`overdue`** | Quá hạn | Khoản học phí đã quá hạn thanh toán (`due_date`) |
| **`payment_transactions`** | `enum` | **`pending`** | Đang xử lý | Giao dịch ZaloPay đang chờ quét mã |
| | | **`success`** | Thành công | Thanh toán thành công, hệ thống đã gia hạn gói |
| | | **`failed`** | Thất bại | Giao dịch thất bại / lỗi thanh toán |
| | | **`refunded`** | Đã hoàn tiền | Giao dịch đã được hoàn tiền |
| **`center_subscriptions`** | `enum` | **`pending`** | Chờ kích hoạt | Đơn đăng ký gói đang chờ xử lý |
| | | **`active`** | Đang hiệu lực | Gói dịch vụ phần mềm đang hoạt động |
| | | **`expired`** | Đã hết hạn | Gói dịch vụ đã hết hạn |
| | | **`cancelled`** | Đã hủy | Gói dịch vụ đã bị hủy |
| **`contact_requests`** | `enum` | **`pending`** | Chờ liên hệ | Yêu cầu tư vấn mới gửi từ Landing Page |
| | | **`contacted`** | Đã liên hệ | Nhân viên đã gọi điện / gửi mail tư vấn |
| | | **`resolved`** | Đã xử lý xong | Khách hàng đã chốt dùng thử / đăng ký gói |
| | | **`cancelled`** | Hủy bỏ | Khách hàng không có nhu cầu |

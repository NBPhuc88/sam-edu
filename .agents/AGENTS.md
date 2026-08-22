# Project Rules & Guidelines - sam-edu (Hệ thống Quản lý Giáo dục Sam)

Tài liệu quy định kiến trúc, quy chuẩn mã nguồn và quy trình phát triển dành cho AI Agent khi làm việc trên codebase dự án **sam-edu**.

---

## 1. Tổng quan & Tech Stack (Overview & Stack)

- **Hệ thống**: SaaS Quản lý Đa Trung tâm Giáo dục (Multi-Center Student Management System).
- **Backend**: Laravel 13, PHP 8.3+, MySQL (`DB_CONNECTION=mysql`).
- **Frontend**: React 19 + Vite 6 + Inertia.js v3 (`@inertiajs/react`).
- **Styling**: Tailwind CSS v4 + custom styles tại [`resources/css/components.css`](file:///home/phuc/Desktop/php/projects/sam-edu/resources/css/components.css).

---

## 2. Quy tắc Kiến trúc Cốt lõi (Core Architecture Principles)

> [!IMPORTANT]
> **1. TÀI KHOẢN ĐỘC LẬP (3 LOẠI TÀI KHOẢN AUTHENTICATABLE)**:
> Sử dụng 3 loại tài khoản đăng nhập độc lập chính: `admins`, `teachers`, `students`.
> Trung tâm (`centers`) là thực thể tổ chức đào tạo, không có tài khoản đăng nhập riêng (`username`/`password`) mà được quản trị bởi Quản trị viên (`admins`).

> [!IMPORTANT]
> **2. ADMIN ROLE & QUYỀN HẠN**:
>
> - Bảng `admins` sử dụng cột `role` để phân biệt: `super_admin` và `admin`.
> - **Chỉ tồn tại DUY NHẤT 1 tài khoản `super_admin` trong toàn bộ hệ thống**. Không thể hạ cấp hoặc xóa tài khoản `super_admin`.
> - **Mỗi Admin phụ (`role = admin`) chỉ được phân công duy nhất 1 Trung tâm** (1 Trung tâm có thể được quản lý bởi nhiều Admin phụ).
> - **Quyền hạn Trung tâm của Admin phụ**: Không được thêm mới hoặc xóa Trung tâm; không được truy cập danh sách tất cả Trung tâm (`/centers`). Khi truy cập menu Trung tâm, hệ thống tự động chuyển hướng trực tiếp vào trang chi tiết Trung tâm mình quản lý (`/centers/{center_id}/edit`).
> - **ẨN OPTION CHỌN TRUNG TÂM CHO ADMIN PHỤ**: Admin phụ (`role = admin`) không được chọn Trung tâm trong tất cả các ô chọn (`<select center_id>`) và bộ lọc trên toàn hệ thống. Giá trị `center_id` được gán mặc định bằng Trung tâm mình quản lý (`auth.user.center_id`) và ẩn hoàn toàn option/bộ lọc đó khỏi UI. Chỉ Super Admin (`role = super_admin`) mới hiển thị option chọn Trung tâm.

> [!NOTE]
> **3. KHÔNG CÓ BẢNG `parents` RIÊNG**:
> Thông tin liên hệ phụ huynh lưu trực tiếp tại các cột trong bảng `students` (`parent_name`, `parent_phone`, `parent_relationship`).

> [!NOTE]
> **4. TÊN MÔN HỌC ĐÃ CHỨA CẤP ĐỘ**:
> Tên môn học (bảng `subjects`) đã bao gồm cấp độ. Cấu hình học phí và học phần nằm ở bảng `center_subjects`.

> [!NOTE]
> **5. MODEL `SchoolClass` DÙNG CHO BẢNG `classes`**:
> Model tương ứng với bảng `classes` được đặt tên là `App\Models\SchoolClass` (do `Class` là từ khóa dự phòng của PHP).

> [!IMPORTANT]
> **6. QUY TẮC NHẬP MÃ & TỰ ĐỘNG SINH MÃ (CODE GENERATION RULES)**:
>
> - **Cho phép tự nhập hoặc để trống để tự sinh**: Tất cả các trường mã định danh (`code`, `admin_code`, `teacher_code`, `student_code`, v.v.) người dùng có thể tự nhập theo ý muốn hoặc để trống để hệ thống tự động sinh mã.
> - **Cấu trúc mã tự sinh chuẩn**: `[Tiền tố thực thể (Prefix)][Số thứ tự 9 chữ số padded zeros]`.
>   - **Phòng học (`rooms`)**: `R000000001`, `R000000002`, ... (`sprintf('R%09d', $nextId)`)
>   - **Môn học (`subjects`)**: `S000000001`, `S000000002`, ... (`sprintf('S%09d', $nextId)`)
>   - **Lớp học (`classes`)**: `C000000001` (hoặc `CLS000000001`)
>   - **Trung tâm (`centers`)**: `CTR000000001`
>   - **Giáo viên (`teachers`)**: `GV000000001` (hoặc `T000000001`)
>   - **Học sinh (`students`)**: `HS000000001` (hoặc `STD000000001`)
>   - **Quản trị viên (`admins`)**: `ADM000000001`
> - **Xử lý Backend**: Trong Service/Repository, khi trường `code` rỗng hoặc null, tự động tính toán mã kế tiếp duy nhất theo tiền tố quy định và đảm bảo không bị trùng lặp.
> [!IMPORTANT]
> **7. QUY TẮC KIỂU DỮ LIỆU CỘT `status` (STATUS DATA TYPES)**:
>
> - **Bảng `classes` & `students` sử dụng kiểu số nguyên `tinyint`**:
>   - **`classes.status`**: `0` = Tạm ngưng (`inactive`), `1` = Đang học (`active`), `2` = Đã hoàn thành (`completed`).
>   - **`students.status`**: `0` = Tạm ngưng/Khóa (`inactive`), `1` = Đang học (`active`), `2` = Đã tốt nghiệp (`graduated`).
> - **Khi viết truy vấn Backend**: Bắt buộc so sánh bằng số nguyên: `->where('status', 1)` hoặc `->whereIn('status', [1, 2])`. **Tuyệt đối không so sánh bằng chuỗi** `where('status', 'active')` để tránh lỗi so sánh kiểu MySQL làm mất dữ liệu.
> - Chi tiết toàn bộ các bảng xem tại: [`.agents/DATABASE_STATUS_CONVENTIONS.md`](file:///home/phuc/Desktop/php/projects/sam-edu/.agents/DATABASE_STATUS_CONVENTIONS.md).

---

## 3. Quy tắc Phân lớp Backend (Controller - Service - Repository)

> [!IMPORTANT]
> **BẮT BUỘC TUÂN THỦ MÔ HÌNH 3 LỚP**:
>
> 1. **Controller Layer**: Chỉ làm nhiệm vụ nhận request, validate dữ liệu (FormRequest), gọi Service Interface và trả về Response / Inertia View. Không được chứa Business Logic hay truy vấn Eloquent/DB trực tiếp.
> 2. **Service Layer**: Thực hiện toàn bộ logic nghiệp vụ (Business Logic). Bắt buộc phải có **Interface** và đăng ký Binding trong `AppServiceProvider.php`.
> 3. **Repository Layer**: Thực hiện tất cả truy vấn cơ sở dữ liệu (Eloquent / DB Queries). Bắt buộc phải có **Interface** và đăng ký Binding trong `AppServiceProvider.php`.

> [!IMPORTANT]
> **GỬI MAIL QUA QUEUE**:
> Tất cả các tác vụ gửi Email (thông báo đăng ký, cập nhật thông tin, mã OTP...) BẮT BUỘC phải thực hiện bất đồng bộ qua **Queue** (`Mail::to(...)->queue(...)`) và Mailable class phải `implements ShouldQueue`.

---

## 4. Hệ thống Đăng nhập Multi-Guard & Phân quyền

- **Authenticatable Guards (`config/auth.php`)**:
    - `admin` -> Model `App\Models\Admin`
    - `teacher` -> Model `App\Models\Teacher`
    - `student` -> Model `App\Models\Student`
- **Phân quyền Backend**: Phân quyền trực tiếp trong backend logic dựa trên `account_type` + `role` + dữ liệu phân công (dữ liệu `admin_centers`, lớp dạy của giáo viên, dữ liệu cá nhân của học sinh).

---

## 5. Quy chuẩn Thiết kế UI/UX (Design System Specs)

1. **Màu nền & Màu chữ**: Nền trắng/xám nhẹ (`bg-white`, `bg-slate-50`), chữ đen đậm (`text-gray-900`, `#111827`).
2. **Quy chuẩn Button Tái sử dụng (`<Button>`)**:
    - `variant="success"` (Lưu / Tạo mới / Đăng nhập / Thanh toán / Gửi form): **Nền xanh lá chữ trắng** (`bg-emerald-600 hover:bg-emerald-700 text-white`).
    - `variant="edit"` (Sửa / Cập nhật): **Nền cam chữ trắng** (`bg-amber-500 hover:bg-amber-600 text-white`).
    - `variant="danger"` (Xóa / Hủy): **Nền đỏ chữ trắng** (`bg-red-600 hover:bg-red-700 text-white`).
    - `variant="secondary"` (Đóng / Quay lại): **Nền trắng viền xám chữ đen** (`bg-white border-gray-300 text-gray-900 hover:bg-gray-50`).
3. **Nghiêm cấm Browser Alert/Confirm Mặc định**:
    - Tuyệt đối KHÔNG dùng `alert()`, `confirm()`, `prompt()` mặc định.
    - Tất cả thông báo/xác nhận bắt buộc dùng UI Component thiết kế bằng Tailwind CSS (`<Toast />`, `<Modal />` hoặc Flash Banner).
4. **Quy chuẩn Biểu đồ tròn (Pie Chart)**:
    - Dạng tròn đặc (`innerRadius={0}`).
    - Tỉ lệ phần trăm `%` hiển thị bằng chữ đậm màu trắng (`fill="#ffffff"`) trực tiếp trong lòng các lát cắt.
    - Phần chú thích mô tả màu (`<Legend />`) được đặt ở phía dưới biểu đồ (`verticalAlign="bottom"`).
5. **Dọn dẹp Import khi xóa/thay đổi Component (Frontend Cleanup)**:
    - Khi chỉnh sửa mã nguồn Frontend (React/TypeScript), nếu xóa bỏ hoặc ngưng sử dụng bất kỳ component, icon, hook, function hay type nào thì **BẮT BUỘC phải xóa khai báo `import` tương ứng ở đầu file**.
    - Tuyệt đối không để lại unused imports gây rác mã nguồn hoặc lỗi linter/build.

---

## 6. Danh sách Bảng Cơ sở Dữ liệu & Nhiệm vụ (Database Schema Summary)

|  STT   | Tên bảng (Table)          | Nhiệm vụ & Vai trò của bảng                                                                                                                                                                               |
| :----: | :------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | `centers`                 | Quản lý thông tin Trung tâm đào tạo (mã trung tâm, tên, email, phone, địa chỉ, ngày hết hạn `expires_at`, gói dịch vụ `subscription_plan`, trạng thái `status`).                                           |
| **2**  | `admins`                  | Quản lý Quản trị viên hệ thống (`username`, `full_name`, `email`, `phone`, `password`, `role`: `super_admin` \| `admin`, mã `admin_code`).                                                                |
| **3**  | `teachers`                | Quản lý Giáo viên (`username`, `full_name`, `email`, `phone`, `password`, chuyên môn, mức lương/ca, `center_id`, `status`).                                                                               |
| **4**  | `students`                | Quản lý Học sinh (`username`, `full_name`, `email`, `phone`, `password`, ngày sinh, giới tính, địa chỉ, thông tin phụ huynh `parent_name`, `parent_phone`, `parent_relationship`, `center_id`, `status`). |
| **5**  | `admin_centers`           | Bảng liên hệ phân công Admin (role `admin`) được quản lý những Trung tâm nào (`admin_id`, `center_id`).                                                                                                   |
| **6**  | `refresh_tokens`          | Lưu vết Refresh Token cho đăng nhập đa thiết bị (Polymorphic: `tokenable_type`, `tokenable_id`, `token_hash`, `expires_at`).                                                                              |
| **7**  | `password_reset_otps`     | Lưu mã xác thực OTP 6 số (hash) kèm thời hạn 15 phút để quên/đặt lại mật khẩu cho 3 loại tài khoản (`email`, `account_type`: admin/teacher/student, `otp_hash`, `expires_at`).                              |
| **8**  | `subjects`                | Quản lý Môn học trực thuộc từng Trung tâm (`center_id`, `code`, `name`, `description`, `total_sessions`, `duration_minutes`, `tuition_fee`, `status`). |
| **9**  | `rooms`                   | Quản lý Phòng học theo từng Trung tâm (`center_id`, `name`, `capacity`).                                                                                                                                  |
| **10** | `classes`                 | Quản lý Lớp học (`center_id`, `teacher_id`, `subject_id`, `room_id`, `name`, `code`, `max_capacity`, `start_date`, `end_date`, `status`). Model: `App\Models\SchoolClass`.                                |
| **11** | `class_students`          | Danh sách học sinh ghi danh trong lớp học (`class_id`, `student_id`, `joined_at`, `status`).                                                                                                              |
| **12** | `class_subjects`          | Liên kết môn học (`subject_id`) và giáo viên phụ trách trong lớp học (`class_id`, `subject_id`, `teacher_id`).                                                                                             |
| **14** | `class_schedules`         | Lịch học cố định hàng tuần (`class_id`, `day_of_week`, `start_time`, `end_time`, `room_id`).                                                                                                              |
| **15** | `class_sessions`          | Ca học thực tế được tạo tự động theo lịch (`class_id`, `session_date`, `start_time`, `end_time`, `teacher_id`, `room_id`, `status`).                                                                      |
| **16** | `session_reschedules`     | Quản lý ca học báo nghỉ, dạy bù hoặc đổi lịch (`session_id`, `old_date`, `new_date`, `reason`, `status`).                                                                                                 |
| **17** | `attendances`             | Điểm danh học sinh trong từng ca học (`session_id`, `student_id`, `status`: present/absent/late, `note`).                                                                                                 |
| **18** | `exams`                   | Quản lý Kỳ thi / Bài kiểm tra (`class_id`, `title`, `exam_date`, `max_score`).                                                                                                                            |
| **19** | `exam_results`            | Bảng điểm kết quả thi của học sinh (`exam_id`, `student_id`, `score`, `grade`, `note`).                                                                                                                   |
| **20** | `exam_result_histories`   | Lịch sử sửa điểm thi của học sinh (`exam_result_id`, `old_score`, `new_score`, `changed_by`, `reason`).                                                                                                   |
| **21** | `student_notes`           | Nhận xét / Ghi chú về học sinh từ giáo viên (`student_id`, `teacher_id`, `content`).                                                                                                                      |
| **22** | `student_documents`       | Tài liệu học tập cá nhân / File đính kèm (`student_id`, `file_name`, `file_path`, `uploaded_by`).                                                                                                         |
| **23** | `notifications`           | Thông báo hệ thống (`title`, `content`, `type`, `sender_id`).                                                                                                                                             |
| **24** | `notification_recipients` | Danh sách người nhận thông báo (`notification_id`, `recipient_type`, `recipient_id`, `is_read`).                                                                                                          |
| **25** | `subscription_plans`      | Các gói dịch vụ phần mềm SaaS (Dùng thử 14 ngày, Gói tháng, Gói năm, giá tiền, số học sinh tối đa, số lớp tối đa).                                                                                        |
| **26** | `center_subscriptions`    | Lịch sử đăng ký / gia hạn gói dịch vụ của các trung tâm (`center_id`, `plan_id`, `start_date`, `end_date`, `status`).                                                                                     |
| **27** | `payment_transactions`    | Giao dịch thanh toán gia hạn qua ZaloPay QR Code v2 (`center_id`, `app_trans_id`, `amount`, `status`, `payment_method`).                                                                                  |
| **28** | `system_settings`         | Cấu hình cài đặt hệ thống toàn cục (key-value: logo, tên hệ thống, email liên hệ, hotline...).                                                                                                            |
| **29** | `contact_requests`        | Yêu cầu tư vấn / liên hệ từ khách hàng gửi qua Landing Page (`name`, `phone`, `email`, `message`, `status`).                                                                                              |
| **30** | `class_chat_messages`     | Tin nhắn trao đổi trong nhóm chat thời gian thực của từng lớp học (`class_id`, `sender_type`, `sender_id`, `message`, `is_pinned`).                                                                       |
| **31** | `student_tuitions`        | Quản lý khoản học phí theo học sinh và lớp học (`center_id`, `student_id`, `class_id`, `title`, `total_amount`, `paid_amount`, `remaining_amount`, `status`, `due_date`, `deleted_at`).                   |
| **32** | `tuition_payments`        | Lịch sử các đợt đóng tiền học phí từng phần của học sinh (`student_tuition_id`, `amount`, `payment_date`, `payment_method`, `transaction_code`, `received_by`, `deleted_at`).                               |

---

## 7. Quy tắc Môi trường Docker & Thực thi Lệnh Backend (Docker Environment & Execution Rules)

> [!IMPORTANT]
> **HỆ THỐNG CÓ 2 MÔI TRƯỜNG DOCKER (BẮT BUỘC KIỂM TRA ĐƯỜNG DẪN DỰ ÁN TRƯỚC KHI THỰC THI)**:
> Trước khi chạy bất kỳ lệnh Docker/Artisan nào, Agent phải kiểm tra đường dẫn thư mục làm việc hiện tại (`pwd` / Workspace Root) để chọn đúng môi trường:
>
> ### **Trường hợp 1: Dự án tại `~/Desktop/web/projects/sam-edu` (hoặc `/home/phuc/Desktop/web/projects/sam-edu`)**
> - **File Docker Compose**: `~/Desktop/web/docker/docker-compose.yml` (hoặc `/home/phuc/Desktop/web/docker/docker-compose.yml`)
> - **Service container**: `php83`
> - **Thư mục dự án trong container**: `/var/www/sam-edu`
> - **Cú pháp lệnh**:
>   ```bash
>   docker compose -f ~/Desktop/web/docker/docker-compose.yml exec -w /var/www/sam-edu php83 <command>
>   ```
>
> ### **Trường hợp 2: Dự án tại `~/Desktop/php/projects/sam-edu` (hoặc `/home/phuc/Desktop/php/projects/sam-edu`)**
> - **File Docker Compose**: `/home/phuc/Desktop/php/docker/docker-compose.yml` (hoặc `~/Desktop/php/docker/docker-compose.yml`)
> - **Service container**: `workspace-83` (hoặc `php83`)
> - **Thư mục dự án trong container**: `/var/www/sam-edu`
> - **Cú pháp lệnh**:
>   ```bash
>   docker compose -f /home/phuc/Desktop/php/docker/docker-compose.yml exec -w /var/www/sam-edu workspace-83 <command>
>   ```

### Ví dụ thực tế cho các tác vụ thường dùng:
- **Artisan Migrate**: `<docker-compose-prefix> php artisan migrate`
- **Wayfinder Generate**: `<docker-compose-prefix> php artisan wayfinder:generate`
- **Pint Formatter**: `<docker-compose-prefix> vendor/bin/pint <files>`
- **Pest Test**: `<docker-compose-prefix> php artisan test --compact`
- **PHP Syntax Check**: `<docker-compose-prefix> php -l <relative-path-to-file>`

---

## 8. Kiểm tra & Biên dịch (Verification Commands)

Mọi chỉnh sửa mã nguồn trước khi hoàn tất CẦN đảm bảo các lệnh kiểm tra sau chạy thành công 0 lỗi:

- **TypeScript / Frontend Type Check**: `npx tsc --noEmit`
- **Frontend Build**: `npm run build`
- **PHP Formatting**: `docker compose -f /home/phuc/Desktop/php/docker/docker-compose.yml exec -w /var/www/sam-edu workspace-83 vendor/bin/pint <files>`
- **Backend Tests**: `docker compose -f /home/phuc/Desktop/php/docker/docker-compose.yml exec -w /var/www/sam-edu workspace-83 php artisan test --compact`

---

## 9. Quy Chuẩn Kiến Trúc Component Toàn Dự Án (3-Layer Component Architecture)

> [!IMPORTANT]
> **NGHIÊM CẤM VIẾT CODE GIAO DIỆN INLINE TRÙNG LẶP (DRY RULE)**:
> Mọi mẫu thiết kế hoặc thành phần giao diện xuất hiện từ 2 màn hình trở lên bắt buộc phải sử dụng hoặc tách thành component dùng chung theo đúng phân tầng kiến trúc sau:

### 1. Tầng 1: Base UI Kit (`resources/js/components/ui/`)
- Chứa các component nguyên tử độc lập nghiệp vụ:
  - `<Button variant="success|edit|danger|secondary" />`
  - `<Card />`, `<Modal />`, `<ConfirmDialog />`, `<Badge />`, `<Toast />`, `<Tooltip />`
  - `<Input />`, `<DatePicker />`, `<CustomTimePicker />`, `<ScrollableSelect />`, `<MediaUploader />`
  - `<Pagination />`, `<DataTable />`, `<CustomPieChart />`

### 2. Tầng 2: Common Pattern Components (`resources/js/components/common/`)
- Đóng gói các khối giao diện chuẩn hóa dùng cho tất cả các trang CRUD Quản trị:
  - **`PageHeader.tsx`**: Tiêu đề trang, breadcrumb, subtitle và nhóm nút thao tác (Thêm mới, Xuất dữ liệu).
  - **`FilterBar.tsx`**: Thanh tìm kiếm từ khóa, bộ lọc dropdown, nút Đặt lại bộ lọc (`onReset`).
  - **`StatMetricCard.tsx`**: Thẻ thống kê chỉ số số lượng / tài chính kèm icon và badge % tăng giảm.
  - **`StatusBadge.tsx`**: Huy hiệu trạng thái tự động ánh xạ theo [`.agents/DATABASE_STATUS_CONVENTIONS.md`](file:///home/phuc/Desktop/web/projects/sam-edu/.agents/DATABASE_STATUS_CONVENTIONS.md).
  - **`EmptyState.tsx`**: Khung hiển thị danh sách rỗng kèm icon minh họa và nút CTA hành động.
  - **`FormFooterActions.tsx`**: Thanh chân form chứa nút "Hủy" (`variant="secondary"`) và "Lưu/Cập nhật" (`variant="success"`/`variant="edit"`).

### 3. Tầng 3: Domain Module Components (`resources/js/pages/[Module]/components/`)
- Chứa các component chuyên sâu phục vụ nghiệp vụ của từng Module cụ thể (Đề thi, Điểm danh, Lịch học, Học phí).

---

## 10. Quy Chuẩn Hệ Thống Đề Thi & Bài Thi (Exam System Conventions)

> [!IMPORTANT]
> **1. QUY TẮC BỘ 3 COMPONENT CHO MỖI DẠNG CÂU HỎI (TRIAD ARCHITECTURE RULE)**:
> Mỗi dạng câu hỏi trong hệ thống bắt buộc phải được tổ chức thành đủ 3 component độc lập và có tính module hóa cao:
> 1. **Soạn thảo (Admin Question Builder)**: `Admin/Exams/QuestionEditors/[Type]Editor.tsx`
> 2. **Làm bài thi (Interactive Runner)**: `ExamRoom/components/runners/[Type]Runner.tsx` (hoặc routing qua `QuestionRunnerRouter.tsx`)
> 3. **Xem lại kết quả & Lời giải (Interactive Reviewer)**: `ExamRoom/components/reviews/[Type]Review.tsx` (routing qua `QuestionReviewDetail.tsx`)

> [!IMPORTANT]
> **2. QUY CHUẨN MÀU SẮC KHI XEM LẠI KẾT QUẢ THI (EXAM REVIEW COLOR CODING)**:
> - **Đáp án đúng / Lựa chọn chính xác**: Viền và nền **Màu Xanh Lá Cây** (`border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold`) kèm huy hiệu `✓ Chính xác`.
> - **Đáp án học sinh chọn sai**: Viền và nền **Màu Đỏ** (`border-2 border-rose-400 bg-rose-50 text-rose-950 font-bold`) kèm huy hiệu `✗ Chưa đúng` và ghi chú đáp án đúng chuẩn màu xanh.
> - **Dạng câu Ghép Nối (Matching)**: Hiển thị 2 cột như lúc làm bài:
>   - **Dây nối Xanh liền** (`#10b981`): Nối các cặp học sinh đã ghép đúng.
>   - **Dây nối Đỏ liền** (`#ef4444`): Nối các cặp học sinh đã ghép sai.
>   - **Dây nối Xanh nét đứt** (`#10b981`, dashed): Chỉ dẫn cặp nối đúng chuẩn của đề thi.
> - **Dạng câu Sắp Xếp (Ordering)**:
>   - Đúng 100%: Chỉ hiển thị duy nhất **1 hàng màu Xanh Lá Cây**.
>   - Có lỗi sai: Hiển thị rõ **2 khối riêng biệt** (Khối 1: `✗ Thứ tự bạn đã chọn` có vị trí sai màu đỏ; Khối 2: `✓ Thứ tự đúng chuẩn của đề` màu xanh lá cây).

> [!IMPORTANT]
> **3. QUY CHUẨN PHÂN TRANG THEO PHẦN THI (SECTION-BASED PAGINATION RULE)**:
> - Các câu hỏi trong cùng một phần thi (`Section`) phải được hiển thị tập trung trên cùng một trang, không cuộn dài toàn bộ bài thi.
> - Bắt buộc sử dụng `<ExamSectionTabs />` ở đầu trang và `<ExamSectionPagination />` ở chân trang để chuyển phần mượt mà.



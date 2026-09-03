# Project Rules & Guidelines - sam-edu (Hệ thống Quản lý Giáo dục Sam)

Tài liệu quy định kiến trúc, quy chuẩn mã nguồn và quy trình phát triển dành cho AI Agent khi làm việc trên codebase dự án **sam-edu**.

---

> [!CAUTION]
> ## 0. QUY TẮC BẮT BUỘC VỀ PHẠM VI DỰ ÁN (STRICT WORKSPACE BOUNDARY)
> - **CHỈ THAO TÁC DUY NHẤT TRONG THƯ MỤC CỦA DỰ ÁN NÀY (`sam-edu`)**: AI Agent chỉ được phép đọc, tạo, chỉnh sửa, xóa file hoặc thực thi lệnh bên trong thư mục làm việc của dự án hiện tại (`/home/phuc/Desktop/web/projects/sam-edu`).
> - **NGHIÊM CẤM TUYỆT ĐỐI CHỈNH SỬA / CAN THIỆP SANG PROJECT KHÁC**:
>   - Tuyệt đối **KHÔNG ĐƯỢC PHÉP** can thiệp, mở, sửa đổi file, tạo file, xoá file hay chạy lệnh làm ảnh hưởng sang bất kỳ project nào khác (ví dụ: `demo`, `sam-edu-demo`, các project khác trong `~/Desktop/web/projects/` hay bất kỳ thư mục nào ngoài workspace này).
>   - Mọi thao tác Terminal/Docker chỉ được trỏ đúng container và thư mục của `sam-edu` (`/var/www/sam-edu`).
>   - Tuyệt đối không nhầm lẫn đường dẫn hoặc tác động chéo giữa các workspace khác nhau.

---

## 1. Tổng quan & Tech Stack (Overview & Stack)

- **Hệ thống**: SaaS Quản lý Đa Trung tâm Giáo dục (Multi-Center Student Management System).
- **Backend**: Laravel 13, PHP 8.3+, MySQL (`DB_CONNECTION=mysql`).
- **Frontend**: React 19 + Vite 6 + Inertia.js v3 (`@inertiajs/react`).
- **Styling**: Tailwind CSS v4 + custom styles tại [`resources/css/components.css`](file:///home/phuc/Desktop/web/projects/sam-edu/resources/css/components.css).

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
> - **Cấu trúc mã tự sinh chuẩn**: `[Tiền tố thực thể (Prefix)][Số thứ tự 7 chữ số padded zeros]`.
>   - **Phòng học (`rooms`)**: `R0000001`, `R0000002`, ... (`sprintf('R%07d', $nextId)`)
>   - **Môn học (`subjects`)**: `S0000001`, `S0000002`, ... (`sprintf('S%07d', $nextId)`)
>   - **Lớp học (`classes`)**: `C0000001` (hoặc `CLS0000001`)
>   - **Trung tâm (`centers`)**: `CTR0000001`
>   - **Giáo viên (`teachers`)**: `GV0000001` (hoặc `T0000001`)
>   - **Học sinh (`students`)**: `HS0000001` (hoặc `STD0000001`)
>   - **Quản trị viên (`admins`)**: `ADM0000001`
>   - **Đề thi (`exams`)**: `EX0000001`
> - **Xử lý Backend**: Trong Service/Repository, khi trường `code` rỗng hoặc null, tự động tính toán mã kế tiếp duy nhất theo tiền tố quy định và đảm bảo không bị trùng lặp.
> [!IMPORTANT]
> **7. QUY TẮC GIÁ TRỊ SỐ NGUYÊN BẮT ĐẦU TỪ 1 VÀ GIÁ TRỊ 0 DÀNH CHO LỌC "TẤT CẢ" (1-BASED INTEGER CONSTANTS & 0 FOR ALL-FILTER)**:
>
> - **Tất cả giá trị enum / status / role / type / gender / method lưu DB BẮT BUỘC là số nguyên bắt đầu từ 1 (`>= 1`)**:
>   - **`classes.status`**: `1` = Đang học (`active`), `2` = Tạm ngưng (`inactive`), `3` = Đã hoàn thành (`completed`), `4` = Đã đóng (`closed`).
>   - **`students.status`**: `1` = Đang hoạt động (`active`), `2` = Tạm dừng (`paused`), `3` = Hoàn thành (`completed`), `4` = Nghỉ học (`dropped`).
>   - **`centers.status`**: `1` = Đang hoạt động (`active`), `2` = Tạm ngưng (`paused`), `3` = Đã hết hạn (`expired`).
>   - **`admins.role`**: `1` = `super_admin`, `2` = `admin`.
> - **Quy ước giá trị `0` dành riêng cho Filter "Tất cả"**: Tuyệt đối không dùng `all` hoặc `''` cho filter. Khi filter gửi `0` (hoặc rỗng), backend kiểm tra `if (! empty($status))` sẽ nhận `empty(0)` là `true` và bỏ qua điều kiện lọc.
> - **Khi viết truy vấn Backend**: Bắt buộc so sánh bằng số nguyên: `->where('status', Constant::CLASS_STATUS_ACTIVE)`. **Tuyệt đối không so sánh bằng chuỗi** `where('status', 'active')`.
> - Chi tiết toàn bộ các bảng xem tại: [`.agents/DATABASE_STATUS_CONVENTIONS.md`](file:///home/phuc/Desktop/web/projects/sam-edu/.agents/DATABASE_STATUS_CONVENTIONS.md).

> [!IMPORTANT]
> **8. QUY TẮC NHẤT QUÁN TÊN TRƯỜNG & TUYỆT ĐỐI KHÔNG DÙNG STRING MATCH / FALLBACK TRONG MODEL & BACKEND**:
>
> - **Chỉ sử dụng 1 tên trường và 1 kiểu dữ liệu số nguyên duy nhất**: Mỗi thực thể / quan hệ chỉ được phép sử dụng duy nhất một tên trường chuẩn xuyên suốt toàn bộ hệ thống (Database, Migration, Model, FormRequest, Service, Repository, Inertia Shared Props, Typescript Interfaces, Form components).
> - **TUYỆT ĐỐI KHÔNG VIẾT STRING FALLBACK HOẶC STRING MATCH TRONG MODEL/BACKEND**:
>   - Tuyệt đối **KHÔNG** viết mutator/match nhận chuỗi kiểu `$this->attributes['status'] = match ($value) { 'draft' => Constant::EXAM_STATUS_DRAFT, ... }`. Model chỉ cast integer `['status' => 'integer']` và nhận dữ liệu số nguyên chuẩn.
>   - Mọi nơi trong Controller, Service, Seeder, Test, Frontend **BẮT BUỘC** truyền trực tiếp hằng số integer `Constant::*` (hoặc hằng số TypeScript `CONSTANT_*`).
>   - Tuyệt đối **KHÔNG** khai báo kiểu `subscription_plan_id?: number; subscription_plan?: number;` trong TypeScript interface.
>   - Tuyệt đối **KHÔNG** viết logic gộp/kiểm tra fallback kiểu `if ($this->has('plan_id') && ! $this->has('plan_code'))` hay `$data['plan_id'] ?? $data['plan_code']`.
> - **Quy định cụ thể cho gói dịch vụ SaaS**:
>   - Bảng `centers`: Bắt buộc chỉ dùng `subscription_plan_id` (`BIGINT UNSIGNED` khóa ngoại tham chiếu `subscription_plans.id`). Không dùng `subscription_plan`.
>   - Bảng `center_subscriptions`: Bắt buộc chỉ dùng `plan_id` (`BIGINT UNSIGNED` khóa ngoại tham chiếu `subscription_plans.id`). Không dùng `plan_code`.

> [!IMPORTANT]
> **9. QUY TẮC GỬI DỮ LIỆU SỐ NGUYÊN TỪ PHÍA FRONTEND (INTEGER FIELD & FILTER PARAMS RULES)**:
>
> - **Bên gửi (Frontend) BẮT BUỘC gửi giá trị số nguyên (`number` / `integer`) & LÀM SẠCH PARAMS TRƯỚC KHI GỬI**:
>   - Đối với tất cả các trường có kiểu dữ liệu là số nguyên trong cơ sở dữ liệu (`status`, `role`, `plan_id`, `subscription_plan_id`, `gender`, `plan_type`, `center_id`, `max_students`, `max_classes`, v.v.), phía Frontend (Form submissions, Select dropdowns, URL Filter query params) **BẮT BUỘC phải gửi giá trị kiểu số nguyên (`Number(...)` hoặc hằng số `ENUM`)**.
>   - **Nghiêm cấm gửi chuỗi định danh thay cho số**: Tuyệt đối **KHÔNG** gửi chuỗi như `'active'`, `'inactive'`, `'scheduled'`, `'in_progress'`, `'completed'`, `'cancelled'`, `'admin'`, `'super_admin'`, `'paid'`, `'unpaid'` lên server.
>   - **Xử lý lựa chọn "Tất cả" / Không lọc**: Khi người dùng chọn "Tất cả" (`''`) hoặc để trống (`''`), Frontend **BẮT BUỘC phải loại bỏ hoàn toàn trường đó khỏi request params** (`undefined` hoặc không đưa key đó vào object params gửi lên `router.get()`), tuyệt đối không gửi chuỗi rỗng `""` hay `''` lên server.
> [!IMPORTANT]
> **10. QUY TẮC TUYỆT ĐỐI KHÔNG THỰC HIỆN QUERY / CREATE / UPDATE / DELETE ĐƠN LẺ TRONG VÒNG LẶP (BULK & CHUNKED BATCH OPERATIONS ONLY)**:
>
> - **Nghiêm cấm tuyệt đối**:
>   - Không được gọi các hàm ghi DB đơn lẻ (`Model::create()`, `$model->update()`, `$model->save()`, `$model->delete()`, `firstOrCreate()`, `updateOrCreate()`) bên trong vòng lặp (`foreach`, `for`, `while`).
>   - Không được chạy các câu truy vấn con (Sub-queries / Aggregates như `$model->payments()->sum('amount')`, `Model::where()->first()`, `Model::find()`) lặp đi lặp lại trong vòng lặp gây ra lỗi N+1 Query nghiêm trọng và làm suy giảm hiệu năng DB.
> - **Quy tắc Thêm mới nhiều bản ghi (Bulk Insert)**:
>   - Gom toàn bộ dữ liệu vào mảng đệm `$buffer = []` và sử dụng `insert($buffer)` hoặc `insertOrIgnore($buffer)`.
>   - Đối với số lượng lớn dữ liệu: Giới hạn mảng tối đa 1.000 items. Khi `count($buffer) >= 1000`, thực thi 1 câu lệnh `insert` rồi gán `$buffer = []` để xử lý tiếp. Sau khi thoát vòng lặp, nếu `count($buffer) > 0` thì thực thi tiếp lượt insert cuối cùng.
> - **Quy tắc Cập nhật nhiều bản ghi (Bulk Update / Upsert)**:
>   - Cập nhật cùng giá trị: Dùng `Model::whereIn('id', $ids)->update($data)`.
>   - Cập nhật nhiều bản ghi khác giá trị: Sử dụng `Model::upsert($records, $uniqueBy, $updateColumns)` hoặc gom mảng đệm (tối đa 100 - 1.000 items) thực thi cập nhật bên trong `DB::transaction()`, sau mỗi lượt gán mảng về rỗng để xử lý tiếp cho đến hết; cuối cùng flush nốt phần dư nếu `count($buffer) > 0`.
> - **Quy tắc Xóa nhiều bản ghi (Bulk Delete)**:
>   - Sử dụng `Model::whereIn('id', $ids)->delete()`.
> - **Pre-fetching / Eager Aggregates trước vòng lặp**:
>   - Bắt buộc sử dụng `withSum()`, `withCount()`, `with()`, `whereIn()->keyBy()` để tải trước toàn bộ dữ liệu cần thiết trước khi vào vòng lặp tính toán bộ nhớ (in-memory).

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

> [!IMPORTANT]
> **QUY TẮC IMPORT PHP Ở ĐẦU FILE (USE STATEMENTS IMPORT RULE)**:
> - **Nghiêm cấm viết FQCN inline trong mã nguồn**: Tuyệt đối KHÔNG viết import inline kiểu `\App\Models\Exam::query()`, `\App\Http\Requests\Chat\ReactClassChatMessageRequest`, `\Illuminate\Support\Facades\Mail` hay `\App\Mail\...` bên trong logic code, method signatures, return types hoặc properties.
> - **Bắt buộc khai báo `use` ở đầu file**: Tất cả các Model, Service, Repository, FormRequest, Mailable, Facade, Collection, v.v. đều phải được khai báo bằng lệnh `use` ở phần đầu file PHP và sử dụng tên class ngắn gọn (short class name) bên dưới.

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
    - `variant="sample"` / `variant="csv-sample"` (Tải tệp mẫu CSV): **Nền xám nhạt viền/chữ xám đậm** (Nền: `#F3F4F6` | Chữ & Viền: `#374151`).
    - `variant="import"` / `variant="csv-import"` (Tải lên / Nhập dữ liệu CSV): **Nền xanh dương nhạt viền & chữ xanh dương** (Nền: `#EFF6FF` | Chữ: `#1D4ED8` | Viền: `#BFDBFE`).
    - `variant="export"` / `variant="csv-export"` (Xuất dữ liệu CSV): **Nền xanh lá nhạt viền & chữ xanh lá đậm / emerald** (Nền: `#ECFDF5` | Chữ: `#047857` | Viền: `#A7F3D0`).
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

## 8. Quy tắc Kiểm tra & Chạy Test (Testing & Verification Rules)

> [!IMPORTANT]
> **QUY TẮC KHÔNG TỰ Ý CHẠY TEST BACKEND (NO AUTOMATIC TESTS)**:
> - **KHÔNG ĐƯỢC TỰ ĐỘNG CHẠY TEST**: AI Agent **tuyệt đối không tự ý chạy các lệnh test backend** (`php artisan test`, Pest test, Feature/Unit tests...).
> - **CUNG CẤP CÂU LỆNH ĐỂ USER TỰ CHẠY**: Khi hoàn tất thay đổi hoặc cần kiểm thử tính năng, AI Agent chỉ xuất câu lệnh test tương ứng trong câu trả lời để người dùng tự thực thi.
> - **Lệnh Frontend verification (cho phép kiểm tra syntax/types)**:
>   - `npx tsc --noEmit`
>   - `npm run build`
> - **Câu lệnh test Backend gửi cho User khi cần**:
>   ```bash
>   docker compose -f ~/Desktop/web/docker/docker-compose.yml exec -w /var/www/sam-edu php83 php artisan test --compact
>   ```

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

> [!IMPORTANT]
> **4. HIỂN THỊ ĐỊNH DANH CÂU HỎI TRONG HEADER (QUESTION HEADER IDENTIFICATION RULE)**:
> - Định danh câu hỏi (`q.title || q.code`, ví dụ `Q04_BLANK`) và Tên phần thi (`section.title`) được hiển thị gọn gàng, tinh tế ngay trên **Thanh Header của thẻ câu hỏi** cùng với số thứ tự và điểm số.
> - Thân thẻ câu hỏi trực tiếp hiển thị **Nội dung câu hỏi / Đề bài** (`content`) và **Vùng tương tác đáp án**, tránh tạo thêm các thẻ tiêu đề `<h3>` trùng lặp bên trong.

---

## 11. Quy Chuẩn Tối Ưu Phân Trang Deferred Join (Late Lookup Pagination Rule)

> [!IMPORTANT]
> **1. NGUYÊN LÝ KỸ THUẬT DEFERRED JOIN (LATE LOOKUP / JOIN TRÌ HOÃN)**:
> - **Vấn đề của `OFFSET` lớn thông thường**: Khi phân trang trang sâu (ví dụ `LIMIT 50 OFFSET 100000`), MySQL phải đọc toàn bộ các cột dữ liệu của 100.050 bản ghi từ đĩa / Buffer Pool rồi loại bỏ 100.000 dòng đầu, gây tốn I/O và nghẽn CPU.
> - **Cấu trúc SQL tối ưu (Deferred Join)**:
>   ```sql
>   SELECT pre.*
>   FROM (
>       SELECT id
>       FROM table_name
>       WHERE [conditions]
>       ORDER BY [order_columns]
>       LIMIT perPage OFFSET offset
>   ) AS temp
>   INNER JOIN table_name AS pre ON temp.id = pre.id
>   ORDER BY [order_columns];
>   ```
>   - Subquery `temp` chỉ quét qua Index / Primary Key cực nhẹ (`SELECT id`) mà không nạp các cột dữ liệu khác.
>   - Sau khi có danh sách ID của trang hiện tại (ví dụ đúng 15 - 50 IDs), câu lệnh `INNER JOIN` (hoặc `WHERE IN`) mới nạp toàn bộ các cột và các quan hệ Eager Loading (`with(...)`).

> [!IMPORTANT]
> **2. QUY TẮC SỬ DỤNG TRONG TOÀN BỘ CODEBASE SAM-EDU**:
> - Hệ thống đã cấu hình sẵn Macro `deferredPaginate()` cho Eloquent Builder trong [`app/Providers/AppServiceProvider.php`](file:///home/phuc/Desktop/web/projects/sam-edu/app/Providers/AppServiceProvider.php).
> - **BẮT BUỘC 100%**: Tất cả các tầng Repository (hoặc Service) khi phân trang dữ liệu đều phải sử dụng `->deferredPaginate($perPage, $columns, $pageName, $page)` thay vì `->paginate(...)` mặc định.
> - **Cú pháp chuẩn**:
>   ```php
>   return $query->latest('id')->deferredPaginate($perPage, ['*'], 'page', $page);
>   ```






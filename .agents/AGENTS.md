# Project Context & Agent Instructions - sam-edu (Hệ thống Quản lý Giáo dục Sam Edu)

Tài liệu này cung cấp toàn bộ bối cảnh kiến trúc, quy tắc thiết kế, cấu trúc cơ sở dữ liệu và quy trình phát triển dành cho AI Agent khi thao tác trên codebase dự án **sam-edu** (Hệ thống Quản lý Giáo dục Sam Edu).

---

## 1. Tổng quan Dự án (Project Overview)

- **Tên dự án**: **sam-edu** - Hệ thống Quản lý Giáo dục Sam (Multi-Center Student Management System / SaaS).
- **Mô hình kinh doanh**: Cho thuê phần mềm đa trung tâm đào tạo (SaaS Leasing). Hỗ trợ dùng thử 14 ngày, tự động quản lý thời hạn hết hạn (`expires_at`) và tích hợp cổng thanh toán **ZaloPay QR Code v2** để tự động gia hạn.
- **Tech Stack chính**:
  - **Backend**: Laravel 13, PHP 8.3+, MySQL (Kết nối `DB_CONNECTION=mysql`).
  - **Frontend**: React 19 + Vite 6 + Inertia.js v3 (`@inertiajs/react`).
  - **CSS Engine**: Tailwind CSS v4 + file CSS thành phần riêng [`resources/css/components.css`](file:///home/phuc/Desktop/php/projects/sam-edu/resources/css/components.css).

---

## 2. Các Quy tắc Kiến trúc Cốt lõi (Core Architecture Principles)

> [!IMPORTANT]
> **1. KHÔNG DÙNG BẢNG `users`**:
> Hệ thống **hoàn toàn không có bảng `users`**. Hệ thống sử dụng 3 loại tài khoản độc lập chính:
> - `admins` (Quản trị viên hệ thống / Trung tâm)
> - `teachers` (Giáo viên)
> - `students` (Học sinh)

> [!NOTE]
> **2. KHÔNG CÓ BẢNG `parents` RIÊNG**:
> Thông tin liên hệ của phụ huynh/người thân được lưu trực tiếp tại các cột của bảng `students` (`parent_name`, `parent_phone`, `parent_relationship`).

> [!NOTE]
> **3. TÊN MÔN HỌC ĐÃ CHỨA CẤP ĐỘ**:
> Không sử dụng bảng `subject_levels`. Tên môn học (bảng `subjects`) đã bao gồm cấp độ (ví dụ: *Tiếng Trung Sơ Cấp K1*, *Toán 12 Nâng Cao*). Cấu hình học phí và học phần theo trung tâm nằm ở bảng `center_subjects`.

> [!NOTE]
> **4. MODEL `SchoolClass` DÙNG CHO BẢNG `classes`**:
> Vì `Class` là từ khóa dự phòng của PHP, model tương ứng với bảng `classes` được đặt tên là `App\Models\SchoolClass`.

---

## 3. Kiến trúc Viết API & Layer Pattern (Controller - Service - Repository)

> [!IMPORTANT]
> **Quy tắc Viết API & Phân Lớp (Layering Architecture)**:
> 1. **Controller Layer**: Chỉ làm nhiệm vụ nhận request, validate dữ liệu, điều hướng và trả về HTTP Response / Inertia View.
> 2. **Service Layer**: Chịu trách nhiệm thực hiện toàn bộ logic nghiệp vụ (Business Logic). Bắt buộc phải có **Interface**.
> 3. **Repository Layer**: Chịu trách nhiệm thực hiện các truy vấn cơ sở dữ liệu (Database Queries / Eloquent). Bắt buộc phải có **Interface**.

### Cấu trúc Thư mục Quy chuẩn:

```text
app/
├── Services/
│   └── Zalo/
│       ├── ZaloServiceInterface.php
│       └── ZaloService.php
│
└── Repositories/
    └── Center/
        ├── CenterRepositoryInterface.php
        └── CenterRepository.php
```

### Ví dụ Đăng ký Binding trong Service Provider (`AppServiceProvider.php`):
```php
$this->app->bind(
    \App\Services\Zalo\ZaloServiceInterface::class,
    \App\Services\Zalo\ZaloService::class
);
```

---

## 4. Hệ thống Đăng nhập Multi-Guard & Phân quyền

### Authenticatable Guards (`config/auth.php`)
- `admin` -> Model `App\Models\Admin`
- `center` -> Model `App\Models\Center`
- `teacher` -> Model `App\Models\Teacher`
- `student` -> Model `App\Models\Student`

### Đăng nhập Đa thiết bị (Multi-Device Auth)
- Các session/token đăng nhập đa thiết bị được quản lý qua bảng `refresh_tokens` với polymorphic relation: `tokenable_type` (`admin`, `center`, `teacher`, `student`) và `tokenable_id`. Token được lưu dưới dạng hash SHA-256 (`token_hash`).

### Quy tắc Phân quyền Xem Thống kê (`StatisticController.php`)
- **Super Admin**: Xem thống kê TẤT CẢ các trung tâm & toàn bộ lớp học.
- **Center Admin**: Chỉ xem thống kê Trung tâm được phân công trong `admin_centers`.
- **Teacher (Giáo viên)**: Chỉ xem các Lớp học mà mình phụ trách giảng dạy.
- **Student (Học sinh)**: Bị từ chối truy cập (HTTP 403 Forbidden).

---

## 5. Hệ thống Quy chuẩn Thiết kế UI (Design System Specs)

1. **Màu nền chủ đạo**: Màu Trắng (`#ffffff`, `bg-white`, `bg-slate-50`)
2. **Màu chữ chủ đạo**: Màu Đen (`#111827`, `text-gray-900`)
3. **File CSS riêng**: Custom component styles được tổ chức gọn gàng tại [`resources/css/components.css`](file:///home/phuc/Desktop/php/projects/sam-edu/resources/css/components.css).
4. **Quy chuẩn Button Tái sử dụng (`<Button>`)**:
   - `variant="success"` (Lưu / Tạo mới / Đăng nhập / Thanh toán ZaloPay / Gửi form): **Xanh lá chữ trắng** (`bg-emerald-600 hover:bg-emerald-700 text-white`)
   - `variant="edit"` (Sửa / Cập nhật): **Cam chữ trắng** (`bg-amber-500 hover:bg-amber-600 text-white`)
   - `variant="danger"` (Xóa / Hủy): **Đỏ chữ trắng** (`bg-red-600 hover:bg-red-700 text-white`)
   - `variant="secondary"` (Đóng / Quay lại): **Nền trắng viền xám chữ đen** (`bg-white border-gray-300 text-gray-900 hover:bg-gray-50`)

---

## 6. Thư viện Frontend & Cấu trúc Tệp tin (`package.json`)

| Thành phần | Thư viện chọn | Vị trí file trong Dự án |
| :--- | :--- | :--- |
| **Framework** | `React 19` + `Vite 6` | `resources/js/app.tsx` |
| **CSS Engine** | `Tailwind CSS v4` | `resources/css/app.css`, `resources/css/components.css` |
| **Component Pattern** | `shadcn/ui style` | `resources/js/components/ui/` (`Button`, `Input`, `Card`, `Modal`, `DataTable`, `Badge`) |
| **Icons** | `lucide-react` | Nhập trực tiếp từ `lucide-react` |
| **Form & Validation** | `react-hook-form` + `zod` | `resources/js/pages/Auth/Login.tsx`, `resources/js/pages/Home/Contact.tsx` |
| **API Client** | `axios` | `resources/js/lib/axios.ts` (Tích hợp Bearer Token Interceptor) |
| **State Management** | `zustand` | `resources/js/store/useAuthStore.ts` |
| **Data Tables** | `DataTable.tsx` | `resources/js/components/ui/DataTable.tsx` |
| **Charts** | `recharts` | `resources/js/pages/Dashboard.tsx`, `resources/js/pages/Admin/Statistics.tsx` |
| **Animations** | `framer-motion` | `resources/js/components/ui/Modal.tsx` |

---

## 7. Danh sách Bảng Cơ sở Dữ liệu (36 Migrations)

```text
01. centers                     19. exams
02. admins                      20. exam_results
03. teachers                    21. exam_result_histories
04. students                    22. student_notes
05. refresh_tokens              23. student_documents
06. admin_centers               24. notifications
09. subjects                    25. notification_recipients
10. center_subjects             26. roles
11. rooms                       27. permissions
12. classes                     28. role_permissions
13. class_students              29. admin_roles
14. class_schedules             30. teacher_roles
15. class_sessions              31. student_roles
16. session_reschedules         32. center_subscriptions
17. session_reschedules         33. payment_transactions
18. attendances                 34. system_settings
                                35. subscription_plans
                                36. contact_requests
```

---

## 8. Các Lệnh Kiểm Tra Bắt Buộc (Verification Commands)

Mọi chỉnh sửa mã nguồn trước khi hoàn tất turn CẦN đảm bảo 4 lệnh kiểm tra sau chạy thành công với **0 lỗi**:

```bash
# 1. Kiểm tra build tài nguyên Vite
npm run build

# 2. Kiểm tra TypeScript & ESLint
npm run lint && npx tsc --noEmit

# 3. Kiểm tra định dạng PHP Style (Pint)
vendor/bin/pint

# 4. Kiểm tra kiểu tĩnh PHPStan Level 7
composer types:check
```

---

## 9. Quy tắc Tối ưu hóa MySQL cho Phân trang & Tìm kiếm (MySQL Optimization Rules)

> [!IMPORTANT]
> Toàn bộ các chức năng Phân trang (Pagination) và Tìm kiếm (Search) trong hệ thống BẮT BUỘC tuân thủ 2 cấu trúc tối ưu hóa MySQL sau:

### 1. Tối ưu hóa Phân trang (Deferred Join / Subquery SELECT)
Đối với phân trang dữ liệu lớn hoặc truy vấn với `LIMIT / OFFSET`, không `SELECT *` trực tiếp mà sử dụng Subquery chỉ lấy danh sách `id` khóa chính trước, sau đó `INNER JOIN` lại bảng chính để nạp chi tiết các cột:

```sql
SELECT pre.usr_id, usr_email, usr_phone, usr_username, usr_created_at, usr_status
FROM (
    SELECT usr_id
    FROM pre_go_crm_user
    WHERE usr_created_at > '2024-07-23 00:00:00' AND usr_created_at < '2024-08-22 23:59:59'
    ORDER BY usr_created_at ASC, usr_id ASC
    LIMIT 9000000, 50
) AS temp
INNER JOIN pre_go_crm_user AS pre ON temp.usr_id = pre.usr_id
ORDER BY usr_created_at ASC, usr_id ASC;
```

Trong Eloquent / Query Builder Laravel:
```php
$idSubquery = (clone $query)->select('id')->offset($offset)->limit($perPage);
$query->whereIn('id', $idSubquery);
```

---

### 2. Quy tắc Phân loại Index & Tìm kiếm (B-Tree Index vs FULLTEXT INDEX)
> [!IMPORTANT]
> **QUY TẮC CỐT LÕI VỀ INDEX TRONG DỰ ÁN**:
> 1. **KHÔNG DÙNG FULLTEXT CHO TRƯỜNG NGẮN (`VARCHAR` / `STRING`)**:
>    - Tuyệt đối KHÔNG đánh `FULLTEXT INDEX` cho các trường ngắn như `name`, `full_name`, `code`, `student_code`, `teacher_code`, `phone`, `email`, `specialization`.
>    - Các trường ngắn bắt buộc sử dụng **B-Tree Index** (`$table->index(...)` hoặc `$table->unique(...)`) kết hợp tìm kiếm chính xác hoặc `LIKE '%keyword%'` trên các cột có index để hỗ trợ Tiếng Việt chuẩn xác 100% (không bị bỏ sót từ ngắn tiếng Việt như *Văn*, *Phúc*, *K1*).
> 
> 2. **CHỈ DÙNG FULLTEXT INDEX CHO TRƯỜNG TEXT DÀI (`TEXT` / `LONGTEXT`)**:
>    - Chỉ sử dụng `FULLTEXT INDEX` (`$table->fullText(...)`) đối với các trường văn bản dài như `description`, `note`, `content`, `address` khi cần tìm kiếm cụm từ trong đoạn văn bản dài.

Ví dụ Migration B-Tree Index cho trường ngắn:
```php
Schema::table('students', function (Blueprint $table) {
    $table->index('phone', 'idx_students_phone');
    $table->index('email', 'idx_students_email');
    $table->index('full_name', 'idx_students_full_name');
});
```

Ví dụ Migration FULLTEXT INDEX cho trường text dài:
```php
Schema::table('students', function (Blueprint $table) {
    $table->fullText(['address', 'note'], 'ft_students_longtext');
});
```


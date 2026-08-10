# Project Context & Agent Instructions - sam-edu (Hệ thống Quản lý Giáo dục Sam Edu)

Tài liệu này cung cấp toàn bộ bối cảnh kiến trúc, quy tắc thiết kế, cấu trúc cơ sở dữ liệu và quy trình phát triển dành cho AI Agent khi thao tác trên codebase dự án **sam-edu** (Hệ thống Quản lý Giáo dục Sam Edu).

---

## 1. Tổng quan Dự án (Project Overview)

- **Tên dự án**: **sam-edu** - Hệ thống Quản lý Giáo dục Sam (Multi-Center Student Management System / SaaS).
- **Mô hình kinh doanh**: Cho thuê phần mềm đa trung tâm đào tạo (SaaS Leasing). Hỗ trợ dùng thử 14 ngày, tự động quản lý thời hạn hết hạn (`expires_at`) và tích hợp cổng thanh toán **ZaloPay QR Code v2** để tự động gia hạn.
- **Tech Stack chính**:
  - **Backend**: Laravel 11, PHP 8.2+, MySQL (Kết nối `DB_CONNECTION=mysql`).
  - **Frontend**: React 19 + Vite 6 + Inertia.js v3 (`@inertiajs/react`).
  - **CSS Engine**: Tailwind CSS v4 + file CSS thành phần riêng [`resources/css/components.css`](file:///home/phuc/Desktop/php/projects/lopso/resources/css/components.css).

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
- `teacher` -> Model `App\Models\Teacher`
- `student` -> Model `App\Models\Student`

### Đăng nhập Đa thiết bị (Multi-Device Auth)
- Các session/token đăng nhập đa thiết bị được quản lý qua bảng `refresh_tokens` với polymorphic relation: `tokenable_type` (`admin`, `teacher`, `student`) và `tokenable_id`. Token được lưu dưới dạng hash SHA-256 (`token_hash`).

### Quy tắc Phân quyền Xem Thống kê (`StatisticController.php`)
- **Super Admin**: Xem thống kê TẤT CẢ các trung tâm & toàn bộ lớp học.
- **Center Admin**: Chỉ xem thống kê Trung tâm được phân công trong `admin_centers`.
- **Teacher (Giáo viên)**: Chỉ xem các Lớp học mà mình phụ trách giảng dạy.
- **Student (Học sinh)**: Bị từ chối truy cập (HTTP 403 Forbidden).

---

## 5. Hệ thống Quy chuẩn Thiết kế UI (Design System Specs)

1. **Màu nền chủ đạo**: Màu Trắng (`#ffffff`, `bg-white`, `bg-slate-50`)
2. **Màu chữ chủ đạo**: Màu Đen (`#111827`, `text-gray-900`)
3. **File CSS riêng**: Custom component styles được tổ chức gọn gàng tại [`resources/css/components.css`](file:///home/phuc/Desktop/php/projects/lopso/resources/css/components.css).
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

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
> Hệ thống **hoàn toàn không có bảng `users`**. Hệ thống sử dụng 4 loại tài khoản độc lập chính:
> - `admins` (Quản trị viên hệ thống) - có 2 roles: `super_admin`, `admin`
> - `centers` (Trung tâm đào tạo)
> - `teachers` (Giáo viên)
> - `students` (Học sinh)

> [!IMPORTANT]
> **2. ADMIN CÓ 2 ROLES**:
> Trong account type `admin`, có 2 role:
> - `super_admin` - Quyền cao nhất, quản lý toàn hệ thống (tất cả trung tâm, admin khác, cài đặt hệ thống)
> - `admin` - Quyền thấp hơn, không thể quản lý super_admin và cài đặt cấp hệ thống
> 
> Cả hai đều sử dụng bảng `admins` với cột `role` để phân biệt.

> [!NOTE]
> **3. KHÔNG CÓ BẢNG `parents` RIÊNG**:
> Thông tin liên hệ của phụ huynh/người thân được lưu trực tiếp tại các cột của bảng `students` (`parent_name`, `parent_phone`, `parent_relationship`).

> [!NOTE]
> **4. TÊN MÔN HỌC ĐÃ CHỨA CẤP ĐỘ**:
> Không sử dụng bảng `subject_levels`. Tên môn học (bảng `subjects`) đã bao gồm cấp độ (ví dụ: *Tiếng Trung Sơ Cấp K1*, *Toán 12 Nâng Cao*). Cấu hình học phí và học phần theo trung tâm nằm ở bảng `center_subjects`.

> [!NOTE]
> **5. MODEL `SchoolClass` DÙNG CHO BẢNG `classes`**:
> Vì `Class` là từ khóa dự phòng của PHP, model tương ứng với bảng `classes` được đặt tên là `App\Models\SchoolClass`.

---

## 2.1 Account Type vs Role - Kiến trúc Đơn Giản

### Account Type
Xác định tài khoản thuộc bảng nào, độc lập với nhau:
```text
admin       → bảng admins (có cột role)
center      → bảng centers (không có role)
teacher     → bảng teachers (không có role)
student     → bảng students (không có role)
```

### Admin Role (Chỉ áp dụng cho admin)
Role được lưu **trực tiếp vào cột `role` của bảng `admins`**:
```text
super_admin → Quyền cao nhất (quản lý toàn hệ thống)
admin       → Quyền thấp hơn (được phân công quản lý center)
```

> [!IMPORTANT]
> **Kiến trúc không dùng RBAC phức tạp**: 
> - **KHÔNG có bảng** `roles`, `permissions`, `role_permissions`, `admin_roles`, `teacher_roles`, `student_roles`
> - Role chỉ có **2 giá trị cố định**: `super_admin` hoặc `admin`
> - **Center, Teacher, Student không có role** (không cần thiết)
> - Phân quyền được kiểm soát trực tiếp trong **backend logic** dựa trên `account_type` và `role`

Ví dụ cấu trúc dữ liệu:
```text
admins table:
├── id
├── name
├── email
├── password
├── role (enum: 'super_admin', 'admin')
└── created_at

centers table:
├── id
├── name
├── email
├── password (encrypted)
├── expires_at (subscription expiry)
└── created_at

teachers table:
├── id
├── name
├── email
├── password (encrypted)
└── created_at

students table:
├── id
├── name
├── email
├── password (encrypted)
├── parent_name
├── parent_phone
├── parent_relationship
└── created_at
```

### Bảng admin_centers
Bảng **`admin_centers`** không liên quan đến role - nó xác định **Admin được quản lý Center nào**:
```text
admin_centers
├── admin_id (FK → admins)
├── center_id (FK → centers)
└── created_at
```

Ví dụ:
- Admin với `role = admin` được phân công quản lý **Center A, Center B**
- Admin với `role = super_admin` có thể quản lý **tất cả centers** (không cần record trong `admin_centers`)

---

## 2.2 Authentication Context

Sau khi authentication thành công, frontend cần nhận thông tin tương tự:

### Super Admin
```json
{
    "account_type": "admin",
    "account_id": 1,
    "role": "super_admin",
    "name": "Super Admin"
}
```

### Admin
```json
{
    "account_type": "admin",
    "account_id": 2,
    "role": "admin",
    "name": "Admin Name"
}
```

### Center
```json
{
    "account_type": "center",
    "account_id": 10,
    "name": "SAM Hanoi Center"
}
```

### Teacher
```json
{
    "account_type": "teacher",
    "account_id": 25,
    "name": "Nguyen Van A"
}
```

### Student
```json
{
    "account_type": "student",
    "account_id": 100,
    "name": "Nguyen Van B"
}
```

**Frontend gọi object này là `account`** thay vì giả định đây là record từ bảng `users`.

---

## 2.3 Permission Hierarchy

### Super Admin - Quyền Cao Nhất
```text
super_admin
    ├── Quản lý tất cả Trung tâm (Centers)
    ├── Quản lý tất cả Admin khác
    ├── Quản lý Giáo viên toàn hệ thống
    ├── Quản lý Học sinh toàn hệ thống
    ├── Quản lý Môn học (Subjects)
    ├── Quản lý Lớp học toàn hệ thống
    ├── Quản lý Tài chính toàn hệ thống
    ├── Xem Báo cáo toàn hệ thống
    └── Cài đặt Hệ thống
```

### Admin - Quyền Vừa Phải
```text
admin
    ├── Quản lý tất cả Trung tâm được phân công (admin_centers)
    ├── Quản lý Giáo viên theo trung tâm
    ├── Quản lý Học sinh theo trung tâm
    ├── Quản lý Môn học theo trung tâm
    ├── Quản lý Lớp học theo trung tâm
    ├── Quản lý Tài chính theo trung tâm
    └── Xem Báo cáo theo trung tâm
```

**KHÔNG được**:
- Quản lý Super Admin khác
- Truy cập cài đặt Hệ thống

### Center - Quản Lý Trung Tâm
```text
center
    ├── Quản lý Giáo viên của trung tâm
    ├── Quản lý Học sinh của trung tâm
    ├── Quản lý Lớp học của trung tâm
    ├── Quản lý Lịch học (Schedule)
    ├── Quản lý Điểm danh (Attendance)
    ├── Quản lý Thanh toán
    └── Xem Báo cáo
```

**Chỉ được truy cập dữ liệu thuộc Center của mình**.

### Teacher - Giáo Viên
Xem và quản lý các lớp học mà mình phụ trách giảng dạy, điểm danh của lớp, lịch sử điểm danh của lớp.

### Student - Học Sinh
Xem dữ liệu liên quan đến lớp học, điểm danh, kết quả học tập của chính mình.

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
5. **Nghiêm cấm sử dụng Browser Alert/Confirm/Prompt Mặc Định**:
   - **Tuyệt đối KHÔNG sử dụng `alert()`, `confirm()`, hay `prompt()` mặc định của trình duyệt**.
   - Tất cả các thông báo, phản hồi hành động (thành công, cảnh báo, lỗi, xác nhận xóa/hủy) **bắt buộc phải sử dụng UI component thiết kế bằng Tailwind CSS** (như `<Toast />`, `<Modal />` hoặc Flash Banner).

---

## 6.1 Frontend Structure & Account Handling (Cấu trúc Frontend & Xử lý Account)

> [!IMPORTANT]
> **Quy tắc Tổ chức Cấu trúc Frontend**:

### Folder Structure
```text
resources/js/
├── app.tsx                           # Entry point
├── components/
│   ├── ui/                           # shadcn/ui components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── DataTable.tsx
│   │   └── ...
│   ├── Layout/
│   │   ├── DashboardLayout.tsx       # Shared layout cho tất cả account types
│   │   ├── Sidebar.tsx               # Dynamic sidebar dựa trên account_type + role
│   │   └── Header.tsx
│   ├── ProtectedRoute.tsx            # Route guard theo account_type + role
│   └── Navigation.tsx                # Navigation logic for sidebar
├── pages/
│   ├── Auth/
│   │   ├── Login.tsx                 # Đăng nhập chung
│   │   └── Logout.tsx
│   ├── Admin/                        # Pages cho admin (super_admin, admin)
│   │   ├── Dashboard.tsx
│   │   ├── Admins/
│   │   ├── Centers/
│   │   ├── Teachers/
│   │   ├── Students/
│   │   ├── Subjects/
│   │   ├── Rooms/
│   │   ├── Classes/
│   │   ├── Schedules/
│   │   ├── Exams/
│   │   ├── Payments/
│   │   ├── Reports/
│   │   └── Settings/
│   ├── Center/                       # Pages cho center
│   │   ├── Dashboard.tsx
│   │   ├── Teachers/
│   │   ├── Students/
│   │   ├── Classes/
│   │   └── ...
│   ├── Teacher/                      # Pages cho teacher
│   │   ├── Dashboard.tsx
│   │   ├── Classes/
│   │   └── ...
│   └── Student/                      # Pages cho student
│       ├── Dashboard.tsx
│       └── Classes/
├── config/
│   └── navigation.ts                 # Navigation config theo account_type + role
├── store/
│   └── useAuthStore.ts               # Zustand store chứa account info
├── lib/
│   ├── axios.ts                      # API client với Bearer token
│   └── auth.ts                       # Auth helper functions (isSuperAdmin, isAdmin, etc)
└── types/
    └── auth.ts                       # TypeScript types cho account
```

> [!IMPORTANT]
> **Shared DashboardLayout**:
> - Tất cả 4 account types (admin, center, teacher, student) đều dùng **cùng một DashboardLayout**
> - **KHÔNG tạo** AdminLayout, CenterLayout, TeacherLayout, StudentLayout riêng
> - Sidebar sẽ thay đổi nội dung dựa trên `account_type` và nếu là admin thì cũng dựa trên `role`
> - Header và layout structure giữ nguyên cho tất cả account types

### TypeScript Account Types
```typescript
// resources/js/types/auth.ts
export type AccountType = 'admin' | 'center' | 'teacher' | 'student';
export type AdminRole = 'super_admin' | 'admin';

export interface Account {
    account_type: AccountType;
    account_id: number;
    role?: AdminRole;  // Chỉ tồn tại khi account_type = 'admin'
    name: string;
}

export interface AuthState {
    account: Account | null;
    isAuthenticated: boolean;
    login: (account: Account, token: string) => void;
    logout: () => void;
}
```

### Auth Helper Functions (Simple - No Dynamic RBAC)
```typescript
// resources/js/lib/auth.ts
import { Account } from '@/types/auth';

/**
 * Kiểm tra xem account có phải super_admin hay không
 */
export const isSuperAdmin = (account: Account | null): boolean => {
    return account?.account_type === 'admin' && account?.role === 'super_admin';
};

/**
 * Kiểm tra xem account có phải normal admin (role = admin) hay không
 */
export const isNormalAdmin = (account: Account | null): boolean => {
    return account?.account_type === 'admin' && account?.role === 'admin';
};

/**
 * Kiểm tra xem account có phải admin (super_admin hoặc admin) hay không
 */
export const isAdmin = (account: Account | null): boolean => {
    return account?.account_type === 'admin';
};

/**
 * Kiểm tra xem account có phải center hay không
 */
export const isCenter = (account: Account | null): boolean => {
    return account?.account_type === 'center';
};

/**
 * Kiểm tra xem account có phải teacher hay không
 */
export const isTeacher = (account: Account | null): boolean => {
    return account?.account_type === 'teacher';
};

/**
 * Kiểm tra xem account có phải student hay không
 */
export const isStudent = (account: Account | null): boolean => {
    return account?.account_type === 'student';
};

/**
 * IMPORTANT: Không implement hasPermission() hoặc checkPermission()
 * Vì hệ thống không dùng dynamic RBAC.
 * 
 * Phân quyền được kiểm soát ở Backend:
 * - Backend kiểm tra account_type + role
 * - Backend kiểm tra data scope (admin_centers, teacher classes, etc)
 * - Backend trả về dữ liệu đã lọc hoặc 403 Forbidden
 */
```

> [!IMPORTANT]
> **Authorization Rules**:
> - Frontend: Chỉ check `account_type` + `role` để hiển thị UI
> - Backend: Kiểm soát quyền thực tế trên mỗi API endpoint
> - Frontend không nên tin tưởng dữ liệu hiển thị - Backend phải validate
> - Không có dynamic RBAC - role cố định là `super_admin` hoặc `admin`

### Protected Route Component
```typescript
// resources/js/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Account, AccountType, AdminRole } from '@/types/auth';
import DashboardLayout from './Layout/DashboardLayout';

interface ProtectedRouteProps {
    requiredAccountType?: AccountType[];
    requiredAdminRole?: AdminRole;
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    requiredAccountType,
    requiredAdminRole,
    children,
}) => {
    const { account } = useAuthStore();

    // Check if user is authenticated
    if (!account) {
        return <Navigate to="/auth/login" />;
    }

    // Check account type
    if (requiredAccountType && !requiredAccountType.includes(account.account_type)) {
        return <Navigate to="/unauthorized" />;
    }

    // Check admin role (only for admin accounts)
    if (requiredAdminRole) {
        if (account.account_type !== 'admin' || account.role !== requiredAdminRole) {
            return <Navigate to="/unauthorized" />;
        }
    }

    // Render with shared DashboardLayout
    return (
        <DashboardLayout account={account}>
            {children}
        </DashboardLayout>
    );
};
```

### DashboardLayout Component
```typescript
// resources/js/components/Layout/DashboardLayout.tsx
import { Account } from '@/types/auth';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
    account: Account;
    children: React.ReactNode;
}

export default function DashboardLayout({ account, children }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Shared Sidebar - changes based on account_type + role */}
            <Sidebar account={account} />

            <div className="flex-1 flex flex-col">
                {/* Shared Header */}
                <Header account={account} />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
```

### Sidebar Component (Dynamic based on account_type + role)
```typescript
// resources/js/components/Layout/Sidebar.tsx
import { Account } from '@/types/auth';
import { useNavigationItems } from '@/config/navigation';
import { isSuperAdmin, isAdmin, isCenter, isTeacher, isStudent } from '@/lib/auth';

interface SidebarProps {
    account: Account;
}

export default function Sidebar({ account }: SidebarProps) {
    const navItems = useNavigationItems(account);

    return (
        <aside className="w-64 bg-white border-r border-gray-200">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900">
                    {account.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    {getAccountTypeLabel(account)}
                </p>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavItem key={item.path || item.label} item={item} />
                ))}
            </nav>
        </aside>
    );
}

function getAccountTypeLabel(account: Account): string {
    const labels: Record<string, string> = {
        admin: account.role === 'super_admin' ? 'Super Admin' : 'Admin',
        center: 'Center Manager',
        teacher: 'Teacher',
        student: 'Student',
    };
    return labels[account.account_type] || 'User';
}

function NavItem({ item }: { item: any }) {
    return (
        <div>
            {item.children ? (
                <details className="group">
                    <summary className="cursor-pointer p-2 rounded hover:bg-gray-100">
                        <span>{item.label}</span>
                    </summary>
                    <div className="pl-4 mt-2 space-y-1">
                        {item.children.map((child: any) => (
                            <a
                                key={child.path}
                                href={child.path}
                                className="block p-2 text-sm rounded hover:bg-gray-100"
                            >
                                {child.label}
                            </a>
                        ))}
                    </div>
                </details>
            ) : (
                <a
                    href={item.path}
                    className="block p-2 rounded hover:bg-gray-100"
                >
                    {item.label}
                </a>
            )}
        </div>
    );
}
```

### Auth Store (Zustand)
```typescript
// resources/js/store/useAuthStore.ts
import { create } from 'zustand';
import { Account, AuthState } from '@/types/auth';

export const useAuthStore = create<AuthState>((set) => ({
    account: null,
    isAuthenticated: false,
    
    login: (account: Account, token: string) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('account', JSON.stringify(account));
        set({ account, isAuthenticated: true });
    },
    
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('account');
        set({ account: null, isAuthenticated: false });
    },
}));
```

### Frontend Routes Structure (All using shared DashboardLayout)
```typescript
// resources/js/pages/Routes.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from './Auth/Login';
import AdminDashboard from './Admin/Dashboard';
import AdminCentersList from './Admin/Centers/List';
import AdminTeachersList from './Admin/Teachers/List';
import AdminStudentsList from './Admin/Students/List';
import AdminSettings from './Admin/Settings';
import CenterDashboard from './Center/Dashboard';
import TeacherDashboard from './Teacher/Dashboard';
import StudentDashboard from './Student/Dashboard';

const routes = [
    // Public routes
    { path: '/auth/login', element: <LoginPage /> },
    { path: '/unauthorized', element: <UnauthorizedPage /> },

    // Admin routes (super_admin + admin) - ALL use DashboardLayout
    {
        path: '/admin/dashboard',
        element: (
            <ProtectedRoute requiredAccountType={['admin']}>
                <AdminDashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: '/admin/centers',
        element: (
            <ProtectedRoute requiredAccountType={['admin']}>
                <AdminCentersList />
            </ProtectedRoute>
        ),
    },
    {
        path: '/admin/teachers',
        element: (
            <ProtectedRoute requiredAccountType={['admin']}>
                <AdminTeachersList />
            </ProtectedRoute>
        ),
    },
    {
        path: '/admin/students',
        element: (
            <ProtectedRoute requiredAccountType={['admin']}>
                <AdminStudentsList />
            </ProtectedRoute>
        ),
    },
    // Super Admin only
    {
        path: '/admin/settings',
        element: (
            <ProtectedRoute
                requiredAccountType={['admin']}
                requiredAdminRole="super_admin"
            >
                <AdminSettings />
            </ProtectedRoute>
        ),
    },

    // Center routes - ALL use DashboardLayout
    {
        path: '/center/dashboard',
        element: (
            <ProtectedRoute requiredAccountType={['center']}>
                <CenterDashboard />
            </ProtectedRoute>
        ),
    },

    // Teacher routes - ALL use DashboardLayout
    {
        path: '/teacher/dashboard',
        element: (
            <ProtectedRoute requiredAccountType={['teacher']}>
                <TeacherDashboard />
            </ProtectedRoute>
        ),
    },

    // Student routes - ALL use DashboardLayout
    {
        path: '/student/dashboard',
        element: (
            <ProtectedRoute requiredAccountType={['student']}>
                <StudentDashboard />
            </ProtectedRoute>
        ),
    },
];

export default routes;
```

> [!IMPORTANT]
> **Tất cả routes dùng DashboardLayout**:
> - `/admin/*` → DashboardLayout
> - `/center/*` → DashboardLayout
> - `/teacher/*` → DashboardLayout
> - `/student/*` → DashboardLayout
> - Sidebar sẽ hiển thị content khác nhau dựa trên `account_type` + `role`
> - KHÔNG tạo riêng AdminLayout, CenterLayout, TeacherLayout, StudentLayout

### Sidebar Navigation Structure

#### Super Admin Sidebar
```text
Dashboard

Administration
├── Admins
├── Centers
├── Teachers
└── Students

Academic
├── Subjects
└── Classes

Finance
├── Payments
└── Revenue

Reports

System
└── Settings
```

#### Admin Sidebar
```text
Dashboard

Management
├── Centers
├── Teachers
├── Students
├── Subjects
└── Classes

Finance
├── Payments
└── Revenue

Reports

(KHÔNG hiển thị: Admins, System Settings)
```

#### Center Sidebar
```text
Dashboard

Academic
├── Classes
├── Students
├── Teachers
└── Schedule

Attendance
├── Students
└── Teachers

Finance
├── Payments
└── Revenue

Reports
```

#### Teacher Sidebar
```text
Dashboard

Teaching
├── My Classes
├── My Students
├── Schedule
├── Attendance
├── Assignments
├── Exams
└── Grades

Materials
└── Teaching Materials
```

#### Student Sidebar
```text
Dashboard

Learning
├── My Courses
├── My Classes
├── Schedule
├── Assignments
├── Exams
├── Grades
└── Progress

Finance
└── Payments

Account
├── Profile
└── Notifications
```

### Navigation Configuration Example
```typescript
// resources/js/config/navigation.ts
import { Account } from '@/types/auth';
import { isSuperAdmin, isNormalAdmin } from '@/lib/auth';

export interface NavItem {
    label: string;
    path?: string;
    icon?: string;
    children?: NavItem[];
}

export const navigationConfig = {
    admin: {
        super_admin: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
            {
                label: 'Administration',
                icon: 'Lock',
                children: [
                    { label: 'Admins', path: '/admin/admins' },
                    { label: 'Centers', path: '/admin/centers' },
                    { label: 'Teachers', path: '/admin/teachers' },
                    { label: 'Students', path: '/admin/students' },
                ]
            },
            {
                label: 'Academic',
                icon: 'BookOpen',
                children: [
                    { label: 'Subjects', path: '/admin/subjects' },
                    { label: 'Rooms', path: '/admin/rooms' },
                    { label: 'Classes', path: '/admin/classes' },
                ]
            },
            {
                label: 'Operations',
                icon: 'Zap',
                children: [
                    { label: 'Schedules', path: '/admin/schedules' },
                    { label: 'Sessions', path: '/admin/sessions' },
                    { label: 'Attendance', path: '/admin/attendance' },
                    { label: 'Reschedules', path: '/admin/reschedules' },
                ]
            },
            {
                label: 'Exams',
                icon: 'FileCheck',
                children: [
                    { label: 'Exams', path: '/admin/exams' },
                    { label: 'Results', path: '/admin/exam-results' },
                    { label: 'Result Histories', path: '/admin/exam-result-histories' },
                ]
            },
            {
                label: 'Finance',
                icon: 'DollarSign',
                children: [
                    { label: 'Subscriptions', path: '/admin/subscriptions' },
                    { label: 'Payments', path: '/admin/payments' },
                    { label: 'Plans', path: '/admin/plans' },
                ]
            },
            { label: 'Reports', path: '/admin/reports', icon: 'BarChart3' },
            { label: 'Notifications', path: '/admin/notifications', icon: 'Bell' },
            {
                label: 'System',
                icon: 'Settings',
                children: [
                    { label: 'Settings', path: '/admin/settings' },
                ]
            },
        ],
        admin: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
            {
                label: 'Management',
                icon: 'Users',
                children: [
                    { label: 'Centers', path: '/admin/centers' },
                    { label: 'Teachers', path: '/admin/teachers' },
                    { label: 'Students', path: '/admin/students' },
                    { label: 'Classes', path: '/admin/classes' },
                ]
            },
            {
                label: 'Academic',
                icon: 'BookOpen',
                children: [
                    { label: 'Subjects', path: '/admin/subjects' },
                    { label: 'Rooms', path: '/admin/rooms' },
                ]
            },
            {
                label: 'Operations',
                icon: 'Zap',
                children: [
                    { label: 'Schedules', path: '/admin/schedules' },
                    { label: 'Sessions', path: '/admin/sessions' },
                    { label: 'Attendance', path: '/admin/attendance' },
                    { label: 'Reschedules', path: '/admin/reschedules' },
                ]
            },
            {
                label: 'Exams',
                icon: 'FileCheck',
                children: [
                    { label: 'Exams', path: '/admin/exams' },
                    { label: 'Results', path: '/admin/exam-results' },
                ]
            },
            {
                label: 'Finance',
                icon: 'DollarSign',
                children: [
                    { label: 'Payments', path: '/admin/payments' },
                    { label: 'Subscriptions', path: '/admin/subscriptions' },
                ]
            },
            { label: 'Reports', path: '/admin/reports', icon: 'BarChart3' },
            { label: 'Notifications', path: '/admin/notifications', icon: 'Bell' },
        ],
    },
    center: [
        { label: 'Dashboard', path: '/center/dashboard', icon: 'LayoutDashboard' },
        {
            label: 'Management',
            icon: 'Users',
            children: [
                { label: 'Teachers', path: '/center/teachers' },
                { label: 'Students', path: '/center/students' },
                { label: 'Rooms', path: '/center/rooms' },
                { label: 'Classes', path: '/center/classes' },
            ]
        },
        {
            label: 'Academic',
            icon: 'BookOpen',
            children: [
                { label: 'Subjects', path: '/center/subjects' },
                { label: 'Schedule', path: '/center/schedule' },
            ]
        },
        {
            label: 'Operations',
            icon: 'Zap',
            children: [
                { label: 'Sessions', path: '/center/sessions' },
                { label: 'Reschedules', path: '/center/reschedules' },
                { label: 'Attendance', path: '/center/attendance' },
            ]
        },
        {
            label: 'Exams',
            icon: 'FileCheck',
            children: [
                { label: 'Exams', path: '/center/exams' },
                { label: 'Results', path: '/center/exam-results' },
            ]
        },
        {
            label: 'Finance',
            icon: 'DollarSign',
            children: [
                { label: 'Payments', path: '/center/payments' },
            ]
        },
        { label: 'Reports', path: '/center/reports', icon: 'BarChart3' },
        { label: 'Notifications', path: '/center/notifications', icon: 'Bell' },
        { label: 'Settings', path: '/center/settings', icon: 'Settings' },
    ],
    teacher: [
        { label: 'Dashboard', path: '/teacher/dashboard', icon: 'LayoutDashboard' },
        {
            label: 'Teaching',
            icon: 'BookOpen',
            children: [
                { label: 'My Classes', path: '/teacher/classes' },
                { label: 'My Students', path: '/teacher/students' },
                { label: 'Schedule', path: '/teacher/schedule' },
                { label: 'Sessions', path: '/teacher/sessions' },
                { label: 'Attendance', path: '/teacher/attendance' },
            ]
        },
        {
            label: 'Exams',
            icon: 'FileCheck',
            children: [
                { label: 'Exams', path: '/teacher/exams' },
                { label: 'Results', path: '/teacher/exam-results' },
            ]
        },
        {
            label: 'Students',
            icon: 'Users',
            children: [
                { label: 'Notes', path: '/teacher/student-notes' },
                { label: 'Documents', path: '/teacher/student-documents' },
            ]
        },
        { label: 'Notifications', path: '/teacher/notifications', icon: 'Bell' },
        { label: 'Profile', path: '/teacher/profile', icon: 'User' },
    ],
    student: [
        { label: 'Dashboard', path: '/student/dashboard', icon: 'LayoutDashboard' },
        {
            label: 'Learning',
            icon: 'BookOpen',
            children: [
                { label: 'My Classes', path: '/student/classes' },
                { label: 'Schedule', path: '/student/schedule' },
                { label: 'Attendance', path: '/student/attendance' },
                { label: 'Exams', path: '/student/exams' },
                { label: 'Results', path: '/student/exam-results' },
            ]
        },
        {
            label: 'Documents',
            icon: 'FileText',
            children: [
                { label: 'My Documents', path: '/student/documents' },
            ]
        },
        {
            label: 'Finance',
            icon: 'DollarSign',
            children: [
                { label: 'My Payments', path: '/student/payments' },
            ]
        },
        { label: 'Notifications', path: '/student/notifications', icon: 'Bell' },
        { label: 'Profile', path: '/student/profile', icon: 'User' },
    ],
};

/**
 * Hook để lấy navigation items dựa trên account
 * IMPORTANT: Navigation được dựa trên account_type + role
 * Phân quyền chi tiết được kiểm soát ở Backend API
 */
export const useNavigationItems = (account: Account | null): NavItem[] => {
    if (!account) return [];

    if (account.account_type === 'admin') {
        if (isSuperAdmin(account)) {
            return navigationConfig.admin.super_admin;
        } else if (isNormalAdmin(account)) {
            return navigationConfig.admin.admin;
        }
    } else if (account.account_type === 'center') {
        return navigationConfig.center;
    } else if (account.account_type === 'teacher') {
        return navigationConfig.teacher;
    } else if (account.account_type === 'student') {
        return navigationConfig.student;
    }

    return [];
};
```

> [!IMPORTANT]
> **Navigation và Backend Authorization**:
> - **Frontend Navigation**: Hiển thị menu dựa trên `account_type` + `role`
> - **Backend**: Kiểm soát quyền thực tế trên mỗi API endpoint + data scope
> - **Frontend không là security mechanism**: Backend phải validate mọi request
> - **Data Scoping**: Admin xem centers in admin_centers, Teacher xem assigned classes, Student xem own data

### Naming Conventions - Frontend
- **Pages/Components**: Đặt tên theo chức năng, không theo bảng database
  - ✅ `CentersList.tsx`, `StudentDetail.tsx`
  - ❌ `CenterTable.tsx`, `UserProfile.tsx`
- **Store slices**: Sử dụng `use` prefix
  - ✅ `useAuthStore`, `useCenterStore`
- **Utilities**: Đặt trong `lib/` folder
  - ✅ `permissions.ts`, `validators.ts`
- **Types**: Tổ chức theo domain trong `types/` folder
  - ✅ `types/auth.ts`, `types/center.ts`

---

## 6.2 Thư viện Frontend & Cấu trúc Tệp tin (`package.json`)

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

## 7. Danh sách Bảng Cơ sở Dữ liệu (29 Migrations)

```text
01. centers                     16. session_reschedules
02. admins                      17. attendances
03. teachers                    18. exams
04. students                    19. exam_results
05. refresh_tokens              20. exam_result_histories
06. admin_centers               21. student_notes
07. subjects                    22. student_documents
08. center_subjects             23. notifications
09. rooms                       24. notification_recipients
10. classes                     25. center_subscriptions
11. class_students              26. payment_transactions
12. class_schedules             27. system_settings
13. class_sessions              28. subscription_plans
14. session_reschedules         29. contact_requests
15. attendances
```

> [!IMPORTANT]
> **Kiến trúc Role Đơn Giản - Không dùng RBAC**:
> - **Loại bỏ hoàn toàn**: `roles`, `permissions`, `role_permissions`, `admin_roles`, `teacher_roles`, `student_roles`
> - **Role được lưu trực tiếp** vào cột `role` của bảng `admins` với 2 giá trị: `super_admin`, `admin`
> - **Bảng `admin_centers`** vẫn giữ để xác định admin được quản lý center nào (độc lập với role)
> - **Phân quyền** được kiểm soát trong backend logic dựa trên `account_type` + `role`, không cần hệ thống RBAC động

---

## 7.1 Backend Authorization Pattern - Kiểm soát Quyền Đơn Giản

> [!IMPORTANT]
> **Không dùng hệ thống RBAC phức tạp** - Phân quyền được kiểm soát trực tiếp trong backend logic:

### Admin Authorization (Middleware)
```php
// app/Http/Middleware/AdminAuthMiddleware.php
public function handle($request, Closure $next)
{
    $admin = Auth::guard('admin')->user();

    if (!$admin) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    // Lưu admin vào request
    $request->attributes->add(['admin' => $admin]);

    return $next($request);
}
```

### Super Admin Authorization (Middleware)
```php
// app/Http/Middleware/SuperAdminMiddleware.php
public function handle($request, Closure $next)
{
    $admin = Auth::guard('admin')->user();

    if (!$admin || $admin->role !== 'super_admin') {
        return response()->json(['error' => 'Only super_admin can access'], 403);
    }

    return $next($request);
}
```

### Kiểm Tra Quyền trong Controller
```php
// app/Http/Controllers/Admin/CenterController.php
class CenterController extends Controller
{
    public function index(Request $request)
    {
        $admin = $request->admin;

        if ($admin->role === 'super_admin') {
            // Super admin xem TẤT CẢ center
            $centers = Center::paginate(15);
        } else if ($admin->role === 'admin') {
            // Admin thường chỉ xem center được phân công trong admin_centers
            $centerIds = DB::table('admin_centers')
                ->where('admin_id', $admin->id)
                ->pluck('center_id');
            
            $centers = Center::whereIn('id', $centerIds)->paginate(15);
        }

        return response()->json($centers);
    }

    public function destroy($centerId, Request $request)
    {
        $admin = $request->admin;

        // Super admin có thể xóa bất kỳ center nào
        // Admin thường không có quyền xóa (tùy logic)
        if ($admin->role !== 'super_admin') {
            return response()->json(['error' => 'Permission denied'], 403);
        }

        Center::find($centerId)->delete();
        return response()->json(['message' => 'Center deleted']);
    }
}
```

### Quyền từng Account Type

#### Super Admin
```text
- Tạo, sửa, xóa Admin
- Tạo, sửa, xóa Center
- Tạo, sửa, xóa Teacher (toàn hệ thống)
- Tạo, sửa, xóa Student (toàn hệ thống)
- Tạo, sửa, xóa Subject
- Tạo, sửa, xóa Class (toàn hệ thống)
- Quản lý Finance (toàn hệ thống)
- Xem Report (toàn hệ thống)
- Cấu hình System Settings
```

#### Admin
```text
- Xem Admin (không thể sửa/xóa super_admin)
- Xem Center (chỉ được phân công trong admin_centers)
- Tạo, sửa, xóa Teacher (của center được phân công)
- Tạo, sửa, xóa Student (của center được phân công)
- Tạo, sửa, xóa Subject (của center được phân công)
- Tạo, sửa, xóa Class (của center được phân công)
- Quản lý Finance (của center được phân công)
- Xem Report (của center được phân công)

KHÔNG được:
- Quản lý Super Admin
- Truy cập System Settings
```

#### Center
```text
- Xem/Sửa thông tin center của mình
- Tạo, sửa, xóa Teacher (của center mình)
- Tạo, sửa, xóa Student (của center mình)
- Tạo, sửa, xóa Class (của center mình)
- Quản lý Schedule, Attendance
- Quản lý Finance (của center mình)
- Xem Report (của center mình)

KHÔNG được:
- Xem/Sửa center khác
- Xem/Sửa Admin
- Truy cập System Settings
```

#### Teacher
```text
- Xem thông tin cá nhân
- Xem Class được phụ trách
- Xem Student của các Class mình dạy
- Quản lý Attendance (của Class mình dạy)
- Quản lý Grades/Exams (của Class mình dạy)

KHÔNG được:
- Tạo/Sửa/Xóa Center, Admin
- Xem Student của Class khác
```

#### Student
```text
- Xem thông tin cá nhân
- Xem Class mình học
- Xem Schedule, Attendance của mình
- Xem Grades, Exam Results của mình
- Xem/Upload Document của mình

KHÔNG được:
- Sửa/Xóa bất kỳ record nào
- Xem dữ liệu của Student khác
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


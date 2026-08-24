# Kế Hoạch & Hướng Dẫn Bọc Phân Quyền Nút Bấm CRUD (UI Permissions)

Tài liệu này lưu trữ danh sách các trang cần hoàn thiện bọc quyền động thông qua hook `usePermission()` để ẩn/hiện nút Thêm mới, Sửa, Xóa và cột Thao tác trên giao diện.

---

## 1. Nguyên Tắc Chuẩn Triển Khai (Conventions)

Mỗi file đã có sẵn:
```tsx
import { usePermission } from '@/hooks/usePermission';

// Trong component:
const { can } = usePermission();
```

### Quy tắc bọc component:
1. **Nút Thêm mới / Import**: Bọc bằng `{can('<module>.create') && ( <Button ...>Thêm Mới</Button> )}`
2. **Tiêu đề cột Thao tác (`<th>`)**: Bọc bằng `{(can('<module>.edit') || can('<module>.delete')) && ( <th ...>Thao Tác</th> )}`
3. **Cột nội dung Thao tác (`<td>`)**: Bọc bằng `{(can('<module>.edit') || can('<module>.delete')) && ( <td ...>...</td> )}`
4. **Nút Sửa trong row**: Bọc bằng `{can('<module>.edit') && ( <Button variant="edit" ...>Sửa</Button> )}`
5. **Nút Xóa trong row**: Bọc bằng `{can('<module>.delete') && ( <Button variant="danger" ...>Xóa</Button> )}`

---

## 2. Trạng Thái Hiện Tại

- **Đã hoàn thành 100% (17 trang)**:
  - [x] [`resources/js/pages/Admin/Centers/Index.tsx`](resources/js/pages/Admin/Centers/Index.tsx) (`centers.create`, `centers.edit`, `centers.delete`)
  - [x] [`resources/js/pages/Admin/Admins/Index.tsx`](resources/js/pages/Admin/Admins/Index.tsx) (`admins.create`, `admins.edit`, `admins.delete`)
  - [x] `Admin/Plans/Index.tsx` (`plans.create`, `plans.edit`, `plans.delete`)
  - [x] `Admin/Teachers/Index.tsx` (`teachers.create`, `teachers.edit`, `teachers.delete`)
  - [x] `Admin/Students/Index.tsx` (`students.create`, `students.edit`, `students.delete`)
  - [x] `Admin/Subjects/Index.tsx` (`subjects.create`, `subjects.edit`, `subjects.delete`)
  - [x] `Admin/Rooms/Index.tsx` (`rooms.create`, `rooms.edit`, `rooms.delete`)
  - [x] `Admin/Classes/Index.tsx` (`classes.create`, `classes.edit`, `classes.delete`)
  - [x] `Admin/Holidays/Index.tsx` (`holidays.create`, `holidays.edit`, `holidays.delete`)
  - [x] `Admin/Exams/Index.tsx` (`exams.create`, `exams.edit`, `exams.delete`)
  - [x] `Admin/ExamTypes/Index.tsx` (`exam-types.create`, `exam-types.edit`, `exam-types.delete`)
  - [x] `Admin/ClassExams/Index.tsx` (`class-exams.create`, `class-exams.edit`, `class-exams.delete`)
  - [x] `Admin/Tuitions/Index.tsx` (`tuitions.create`, `tuitions.edit`, `tuitions.delete`)
  - [x] `Admin/Sessions/Index.tsx` (`sessions.edit`)
  - [x] `Admin/Schedules/Index.tsx` (`schedules.create`, `schedules.edit`, `schedules.delete`)
  - [x] `Admin/Tuitions/Show.tsx` (`tuitions.payments`, `tuitions.edit`, `tuitions.delete`)
  - [x] `Admin/Attendance/Show.tsx` (`attendance.save`)

---

## 3. Chi Tiết Từng Trang & Quyền Cần Bọc

### 1. Gói Dịch Vụ SaaS (`Admin/Plans/Index.tsx`)
- **Quyền sử dụng**: `plans.create`, `plans.edit`, `plans.delete`
- **Vị trí cần bọc**:
  - Nút "Tạo Gói Cước Mới" (`/plans/create`) -> `plans.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('plans.edit') || can('plans.delete')`
  - Nút "Sửa" (`/plans/${plan.id}/edit`) -> `plans.edit`
  - Nút "Xóa" (`openDeleteModal(plan)`) -> `plans.delete`

### 2. Quản Lý Giáo Viên (`Admin/Teachers/Index.tsx`)
- **Quyền sử dụng**: `teachers.create`, `teachers.edit`, `teachers.delete`
- **Vị trí cần bọc**:
  - Nút "Thêm Giáo Viên Mới" & "Import CSV" -> `teachers.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('teachers.edit') || can('teachers.delete')`
  - Nút "Sửa" -> `teachers.edit`
  - Nút "Xóa" -> `teachers.delete`

### 3. Quản Lý Học Sinh (`Admin/Students/Index.tsx`)
- **Quyền sử dụng**: `students.create`, `students.edit`, `students.delete`
- **Vị trí cần bọc**:
  - Nút "Thêm Học Sinh Mới" & "Import CSV" -> `students.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('students.edit') || can('students.delete')`
  - Nút "Sửa" -> `students.edit`
  - Nút "Xóa" -> `students.delete`

### 4. Quản Lý Môn Học (`Admin/Subjects/Index.tsx`)
- **Quyền sử dụng**: `subjects.create`, `subjects.edit`, `subjects.delete`
- **Vị trí cần bọc**:
  - Nút "Thêm Môn Học Mới" -> `subjects.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('subjects.edit') || can('subjects.delete')`
  - Nút "Sửa" -> `subjects.edit`
  - Nút "Xóa" -> `subjects.delete`

### 5. Quản Lý Phòng Học (`Admin/Rooms/Index.tsx`)
- **Quyền sử dụng**: `rooms.create`, `rooms.edit`, `rooms.delete`
- **Vị trí cần bọc**:
  - Nút "Thêm Phòng Học Mới" -> `rooms.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('rooms.edit') || can('rooms.delete')`
  - Nút "Sửa" -> `rooms.edit`
  - Nút "Xóa" -> `rooms.delete`

### 6. Quản Lý Lớp Học (`Admin/Classes/Index.tsx`)
- **Quyền sử dụng**: `classes.create`, `classes.edit`, `classes.delete`
- **Vị trí cần bọc**:
  - Nút "Tạo Lớp Học Mới" -> `classes.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('classes.edit') || can('classes.delete')`
  - Nút "Sửa" -> `classes.edit`
  - Nút "Xóa" -> `classes.delete`

### 7. Quản Lý Ngày Lễ (`Admin/Holidays/Index.tsx`)
- **Quyền sử dụng**: `holidays.create`, `holidays.edit`, `holidays.delete`
- **Vị trí cần bọc**:
  - Nút "Thêm Ngày Lễ" & "Khởi tạo ngày lễ chuẩn" -> `holidays.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('holidays.edit') || can('holidays.delete')`
  - Nút "Sửa" -> `holidays.edit`
  - Nút "Xóa" -> `holidays.delete`

### 8. Kho Đề Thi (`Admin/Exams/Index.tsx`)
- **Quyền sử dụng**: `exams.create`, `exams.edit`, `exams.delete`
- **Vị trí cần bọc**:
  - Nút "Tạo Đề Thi Mới" -> `exams.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('exams.edit') || can('exams.delete')`
  - Nút "Sửa" -> `exams.edit`
  - Nút "Xóa" -> `exams.delete`

### 9. Loại Đề Thi (`Admin/ExamTypes/Index.tsx`)
- **Quyền sử dụng**: `exam-types.create`, `exam-types.edit`, `exam-types.delete`
- **Vị trí cần bọc**:
  - Nút "Thêm Loại Đề Thi Mới" -> `exam-types.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('exam-types.edit') || can('exam-types.delete')`
  - Nút "Sửa" -> `exam-types.edit`
  - Nút "Xóa" -> `exam-types.delete`

### 10. Kỳ Thi Lớp Học (`Admin/ClassExams/Index.tsx`)
- **Quyền sử dụng**: `class-exams.create`, `class-exams.edit`, `class-exams.delete`
- **Vị trí cần bọc**:
  - Nút "Giao Đề Thi Cho Lớp" -> `class-exams.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('class-exams.edit') || can('class-exams.delete')`
  - Nút "Sửa" -> `class-exams.edit`
  - Nút "Hủy/Xóa" -> `class-exams.delete`

### 11. Quản Lý Học Phí (`Admin/Tuitions/Index.tsx`)
- **Quyền sử dụng**: `tuitions.create`, `tuitions.edit`, `tuitions.delete`
- **Vị trí cần bọc**:
  - Nút "Tạo Khoản Học Phí Mới" -> `tuitions.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('tuitions.edit') || can('tuitions.delete')`
  - Nút "Sửa" -> `tuitions.edit`
  - Nút "Xóa" -> `tuitions.delete`

### 12. Quản Lý Ca Học (`Admin/Sessions/Index.tsx`)
- **Quyền sử dụng**: `sessions.edit`
- **Vị trí cần bọc**:
  - Nút "Báo nghỉ / Dạy bù / Đổi lịch" -> `sessions.edit`

### 13. Thời Khóa Biểu (`Admin/Schedules/Index.tsx`)
- **Quyền sử dụng**: `schedules.create`, `schedules.edit`, `schedules.delete`
- **Vị trí cần bọc**:
  - Nút "Thêm Lịch Học" -> `schedules.create`
  - Thẻ `<th>Thao Tác</th>` -> `can('schedules.edit') || can('schedules.delete')`
  - Nút "Sửa" -> `schedules.edit`
  - Nút "Xóa" -> `schedules.delete`

### 14. Chi Tiết & Thu Tiền Học Phí (`Admin/Tuitions/Show.tsx`)
- **Quyền sử dụng**: `tuitions.payments`, `tuitions.edit`, `tuitions.delete`
- **Vị trí cần bọc**:
  - Nút "Ghi Nhận Đợt Thu Tiền" -> `tuitions.payments`
  - Nút "Chỉnh Sửa Khoản Thu" -> `tuitions.edit`
  - Nút "Xóa Đợt Đóng Tiền" -> `tuitions.delete`

### 15. Điểm Danh Buổi Học (`Admin/Attendance/Show.tsx`)
- **Quyền sử dụng**: `attendance.save`
- **Vị trí cần bọc**:
  - Nút "Lưu Kết Quả Điểm Danh" -> `attendance.save`

---

## 4. Lệnh Kiểm Tra Sau Khi Hoàn Thành

```bash
# 1. Kiểm tra lỗi TypeScript
npx tsc --noEmit

# 2. Kiểm tra đóng gói giao diện
npm run build

# 3. Chạy toàn bộ test backend
docker compose -f ~/Desktop/web/docker/docker-compose.yml exec -w /var/www/sam-edu php83 php artisan test --compact
```

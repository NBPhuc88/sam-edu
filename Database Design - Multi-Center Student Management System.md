# Database Design - Multi-Center Student Management System

## 1. Tổng quan

Hệ thống quản lý học sinh cho nhiều trung tâm đào tạo.

Mô hình chính:

```text
System
│
├── Centers
│   ├── Admins
│   ├── Teachers
│   ├── Students
│   ├── Classes
│   ├── Subjects
│   └── Rooms
│
├── Schedules
├── Sessions
├── Attendance
├── Exams
├── Exam Results
│
└── Authentication
    ├── Admin Accounts
    ├── Teacher Accounts
    ├── Student Accounts
    └── Refresh Token Sessions
```

Hệ thống có 3 loại tài khoản:

```text
admins
teachers
students
```

**Không tạo bảng `users`.**

Mỗi bảng `admins`, `teachers`, `students` tự chứa:

```text
username
email
password
status
last_login_at
```

Authentication sử dụng:

```text
Access Token
Refresh Token
```

Một tài khoản có thể đăng nhập **đồng thời trên nhiều thiết bị**.

Ví dụ:

```text
Student A

├── iPhone
│   └── Session / Refresh Token A
│
├── Laptop
│   └── Session / Refresh Token B
│
└── Android Tablet
    └── Session / Refresh Token C
```

Đăng xuất một thiết bị không làm đăng xuất các thiết bị khác.

---

# 2. Authentication Architecture

## 2.1 Không sử dụng users

Không tạo:

```text
users
```

Thay vào đó:

```text
admins
teachers
students
```

là 3 loại account độc lập.

---

# 3. Admin Account

## 3.1 admins

```text
admins
- id BIGINT UNSIGNED PK

# Authentication
- username VARCHAR(100) UNIQUE
- email VARCHAR(255) UNIQUE NULL
- password VARCHAR(255)

- status ENUM(
    'active',
    'inactive',
    'locked'
  )

- last_login_at DATETIME NULL

# Profile
- admin_code VARCHAR(50) UNIQUE
- full_name VARCHAR(255)
- phone VARCHAR(30) NULL
- avatar VARCHAR(500) NULL

# System
- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL
```

Password phải được hash.

Không lưu password plaintext.

Laravel:

```php
Hash::make($password);
```

---

# 4. Teacher Account

## 4.1 teachers

```text
teachers
- id BIGINT UNSIGNED PK

# Authentication
- username VARCHAR(100) UNIQUE
- email VARCHAR(255) UNIQUE NULL
- password VARCHAR(255)

- status ENUM(
    'active',
    'inactive',
    'locked'
  )

- last_login_at DATETIME NULL

# Profile
- teacher_code VARCHAR(50)
- center_id BIGINT UNSIGNED FK

- first_name VARCHAR(100)
- last_name VARCHAR(100)
- full_name VARCHAR(255)

- phone VARCHAR(30) NULL
- date_of_birth DATE NULL

- gender ENUM(
    'male',
    'female',
    'other'
  ) NULL

- avatar VARCHAR(500) NULL

- hire_date DATE NULL

- specialization VARCHAR(255) NULL
- note TEXT NULL

# System
- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL
```

Constraint:

```text
UNIQUE(username)
UNIQUE(email)
UNIQUE(center_id, teacher_code)
```

---

# 5. Student Account

## 5.1 students

```text
students
- id BIGINT UNSIGNED PK

# Authentication
- username VARCHAR(100) UNIQUE
- email VARCHAR(255) UNIQUE NULL
- password VARCHAR(255)

- status ENUM(
    'active',
    'inactive',
    'locked',
    'graduated',
    'suspended'
  )

- last_login_at DATETIME NULL

# Profile
- student_code VARCHAR(50)

- center_id BIGINT UNSIGNED FK

- first_name VARCHAR(100)
- last_name VARCHAR(100)
- full_name VARCHAR(255)

- date_of_birth DATE NULL

- gender ENUM(
    'male',
    'female',
    'other'
  ) NULL

- phone VARCHAR(30) NULL
- address TEXT NULL

- avatar VARCHAR(500) NULL

# Parent / Guardian Info
- parent_name VARCHAR(255) NULL
- parent_phone VARCHAR(30) NULL
- parent_relationship VARCHAR(50) NULL

- admission_date DATE NULL

- note TEXT NULL

# System
- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL
```

Constraint:

```text
UNIQUE(username)
UNIQUE(email)
UNIQUE(center_id, student_code)
```

---

# 6. Multi-Device Authentication

Một account có thể login trên nhiều thiết bị cùng lúc.

Ví dụ:

```text
Student ID = 100

refresh_tokens
--------------------------------------------------
id | device_name | token | expires_at | revoked
--------------------------------------------------
1  | iPhone      | ...   | ...         | NULL
2  | Chrome PC   | ...   | ...         | NULL
3  | iPad        | ...   | ...         | NULL
```

Không được thiết kế:

```text
students.refresh_token
```

hoặc:

```text
students.device_token
```

vì một account có thể có nhiều thiết bị.

---

# 7. Refresh Token Sessions

## 7.1 refresh_tokens

Mỗi record đại diện cho **một login session trên một thiết bị**.

```text
refresh_tokens
- id BIGINT UNSIGNED PK

# Account
- tokenable_type ENUM(
    'admin',
    'teacher',
    'student'
  )

- tokenable_id BIGINT UNSIGNED

# Token
- token_hash VARCHAR(255) UNIQUE

# Device
- device_id VARCHAR(255) NULL
- device_name VARCHAR(255) NULL
- device_type ENUM(
    'web',
    'ios',
    'android',
    'desktop',
    'other'
  ) NULL

# Client information
- ip_address VARCHAR(45) NULL
- user_agent TEXT NULL

# Token lifecycle
- expires_at DATETIME
- revoked_at DATETIME NULL
- last_used_at DATETIME NULL

# Token rotation
- replaced_by_token_id BIGINT UNSIGNED FK NULL

# System
- created_at DATETIME
- updated_at DATETIME
```

Indexes:

```text
INDEX(tokenable_type, tokenable_id)

INDEX(device_id)

INDEX(expires_at)

INDEX(revoked_at)

INDEX(tokenable_type, tokenable_id, revoked_at)
```

---

# 8. Why refresh_tokens uses tokenable_type + tokenable_id

Vì không có bảng `users`.

Có 3 loại account:

```text
admins
teachers
students
```

Nên:

```text
tokenable_type = admin
tokenable_id = 10
```

có nghĩa:

```text
admins.id = 10
```

Hoặc:

```text
tokenable_type = teacher
tokenable_id = 20
```

hoặc:

```text
tokenable_type = student
tokenable_id = 30
```

---

# 9. Refresh Token Security

Không lưu refresh token plaintext.

Client nhận:

```json
{
    "access_token": "xxx",
    "refresh_token": "yyy"
}
```

Database chỉ lưu:

```text
token_hash
```

Ví dụ:

```text
refresh_token
     │
     ▼
hash()
     │
     ▼
token_hash
```

---

# 10. Access Token

Access token không nhất thiết phải lưu DB.

Nếu sử dụng JWT:

```text
Access Token
    │
    └── JWT
```

Access token nên có thời gian sống ngắn:

```text
15 - 60 minutes
```

Khuyến nghị:

```text
30 minutes
```

Client gửi:

```http
Authorization: Bearer {access_token}
```

---

# 11. Refresh Token Lifetime

Refresh token có thể sống:

```text
7 - 30 days
```

Khuyến nghị:

```text
30 days
```

Mỗi thiết bị có refresh token riêng.

---

# 12. Login Flow

Ví dụ Student login bằng iPhone:

```text
Student
   │
   │ username + password
   ▼
POST /api/student/login
   │
   ├── Find student
   ├── Check password
   ├── Check status
   │
   ├── Generate Access Token
   │
   ├── Generate Refresh Token
   │
   └── Create refresh_tokens record
   │
   ▼
Client
```

Database:

```text
refresh_tokens

tokenable_type = student
tokenable_id = 100
device_name = iPhone
device_type = ios
token_hash = HASH(...)
revoked_at = NULL
```

---

# 13. Multiple Device Login

Student đăng nhập thêm trên laptop.

Không revoke session trên iPhone.

Database:

```text
refresh_tokens

-----------------------------------------------------------
id | account | device      | type    | revoked_at
-----------------------------------------------------------
1  | student | iPhone      | ios     | NULL
2  | student | Chrome PC   | web     | NULL
```

Hai session đều hoạt động.

---

# 14. Logout Current Device

Ví dụ logout trên iPhone:

```text
POST /api/student/logout
```

Chỉ revoke session hiện tại:

```text
refresh_tokens.id = current_session_id
```

```text
revoked_at = NOW()
```

Laptop vẫn đăng nhập.

---

# 15. Logout All Devices

API:

```text
POST /api/student/logout-all
```

Xử lý:

```text
UPDATE refresh_tokens
SET revoked_at = NOW()
WHERE tokenable_type = 'student'
AND tokenable_id = current_student_id
AND revoked_at IS NULL
```

Tất cả thiết bị bị logout.

Tương tự:

```text
POST /api/teacher/logout-all
POST /api/admin/logout-all
```

---

# 16. Device Management

Có thể cho người dùng xem các thiết bị đang đăng nhập.

## API

```text
GET /api/student/devices
```

Response:

```json
[
    {
        "id": 1,
        "device_name": "iPhone",
        "device_type": "ios",
        "last_used_at": "2026-08-10 10:00:00",
        "created_at": "2026-08-01 10:00:00",
        "current": true
    },
    {
        "id": 2,
        "device_name": "Chrome",
        "device_type": "web",
        "last_used_at": "2026-08-09 20:00:00",
        "created_at": "2026-08-05 20:00:00",
        "current": false
    }
]
```

Logout một thiết bị:

```text
DELETE /api/student/devices/{id}
```

---

# 17. Refresh Token Rotation

Khi access token hết hạn:

```text
Client
   │
   │ refresh_token
   ▼
POST /api/student/refresh
   │
   ├── Find token
   ├── Check hash
   ├── Check expires_at
   ├── Check revoked_at
   │
   ├── Revoke old token
   │
   ├── Create new refresh token
   ├── Create new access token
   │
   └── Link old token → new token
   │
   ▼
Client
```

Old token:

```text
revoked_at = NOW()
replaced_by_token_id = NEW_TOKEN_ID
```

New token:

```text
revoked_at = NULL
```

---

# 18. Centers

## 18.1 centers

```text
centers
- id BIGINT UNSIGNED PK

- code VARCHAR(50)
- name VARCHAR(255)

- phone VARCHAR(30) NULL
- email VARCHAR(255) NULL

- address TEXT NULL

- status ENUM(
    'active',
    'inactive',
    'expired',
    'suspended'
  )

# SaaS Leasing & Expiration
- subscription_plan VARCHAR(100)
- expires_at DATETIME NULL
- trial_ends_at DATETIME NULL
- max_students INT NULL
- max_classes INT NULL

- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL

UNIQUE(code)
```

---

# 19. Admin Center Access

Một admin có thể quản lý nhiều center.

Một center có thể có nhiều admin.

## 19.1 admin_centers

```text
admin_centers
- id BIGINT UNSIGNED PK

- admin_id BIGINT UNSIGNED FK
- center_id BIGINT UNSIGNED FK

- created_at DATETIME
- updated_at DATETIME

UNIQUE(admin_id, center_id)

INDEX(admin_id)
INDEX(center_id)
```

---

# 20. Teachers

Teacher thuộc một center.

```text
teachers.center_id
```

Ví dụ:

```text
Center A
├── Teacher A
├── Teacher B
└── Teacher C
```

---

# 21. Students

Student thuộc một center.

```text
students.center_id
```

Ví dụ:

```text
Center A
├── Student A
├── Student B
└── Student C
```

---

# 22. Parent / Guardian Information

Không tạo bảng `parents` và `student_parents`.

Thông tin liên hệ của phụ huynh / người thân được lưu trực tiếp trong bảng `students`:

```text
- parent_name VARCHAR(255) NULL
- parent_phone VARCHAR(30) NULL
- parent_relationship VARCHAR(50) NULL
```
```

---

# 24. Subjects

Không có `subject_levels`.

Tên môn đã bao gồm cấp độ/chương trình.

Ví dụ:

```text
Toán 10
Toán 11
Toán 12

Tiếng Trung Sơ cấp
Tiếng Trung Trung cấp
Tiếng Trung Cao cấp

Tiếng Anh giao tiếp
IELTS
TOEIC
```

## 24.1 subjects

```text
subjects
- id BIGINT UNSIGNED PK

- code VARCHAR(50)
- name VARCHAR(255)

- description TEXT NULL

- status ENUM(
    'active',
    'inactive'
  )

- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL

UNIQUE(code)
```

---

# 25. Center Subjects

Cho phép mỗi center sử dụng và cấu hình môn học riêng.

## 25.1 center_subjects

```text
center_subjects
- id BIGINT UNSIGNED PK

- center_id BIGINT UNSIGNED FK
- subject_id BIGINT UNSIGNED FK

- code VARCHAR(50)
- name VARCHAR(255) NULL

- description TEXT NULL

- total_sessions INT NULL
- duration_minutes INT NULL

- tuition_fee DECIMAL(12,2) NULL

- status ENUM(
    'active',
    'inactive'
  )

- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL

UNIQUE(center_id, code)

INDEX(center_id, subject_id)
INDEX(subject_id)
```

Ví dụ:

```text
subjects

CN_BEGINNER
Tiếng Trung Sơ cấp
```

Center A:

```text
center_subjects

center_id = 1
subject_id = CN_BEGINNER
code = TQSC
name = Tiếng Trung Sơ cấp
total_sessions = 30
duration_minutes = 90
tuition_fee = 5000000
```

---

# 26. Rooms

## 26.1 rooms

```text
rooms
- id BIGINT UNSIGNED PK

- center_id BIGINT UNSIGNED FK

- code VARCHAR(50)
- name VARCHAR(255)

- capacity INT NULL
- location VARCHAR(255) NULL

- status ENUM(
    'active',
    'inactive'
  )

- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL

UNIQUE(center_id, code)
```

---

# 27. Classes

Một center có nhiều lớp.

## 27.1 classes

```text
classes
- id BIGINT UNSIGNED PK

- center_id BIGINT UNSIGNED FK

- code VARCHAR(50)
- name VARCHAR(255)

- description TEXT NULL

- max_students INT NULL

- start_date DATE NULL
- end_date DATE NULL

- status ENUM(
    'planned',
    'active',
    'completed',
    'cancelled'
  )

- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL

UNIQUE(center_id, code)

INDEX(center_id, status)
```

---

# 28. Class Students

Không lưu:

```text
students.class_id
```

Vì một học sinh có thể chuyển lớp và cần lưu lịch sử.

## 28.1 class_students

```text
class_students
- id BIGINT UNSIGNED PK

- class_id BIGINT UNSIGNED FK
- student_id BIGINT UNSIGNED FK

- enrolled_at DATETIME
- left_at DATETIME NULL

- status ENUM(
    'active',
    'left',
    'completed',
    'transferred'
  )

- note TEXT NULL

- created_at DATETIME
- updated_at DATETIME

INDEX(class_id, status)
INDEX(student_id, status)
```

Có thể đảm bảo tại một thời điểm học sinh chỉ có một class active bằng business logic/service.

---

# 29. Class Subjects

Một lớp có nhiều môn.

Mỗi môn có một giáo viên.

## 29.1 class_subjects

```text
class_subjects
- id BIGINT UNSIGNED PK

- class_id BIGINT UNSIGNED FK
- center_subject_id BIGINT UNSIGNED FK
- teacher_id BIGINT UNSIGNED FK

- start_date DATE NULL
- end_date DATE NULL

- status ENUM(
    'active',
    'inactive',
    'completed'
  )

- note TEXT NULL

- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL

UNIQUE(class_id, center_subject_id)

INDEX(class_id, status)
INDEX(center_subject_id)
INDEX(teacher_id)
```

Ví dụ:

```text
Class TQ-01

├── Tiếng Trung Sơ cấp → Teacher A
├── Tiếng Anh giao tiếp → Teacher B
└── Toán 12 → Teacher C
```

---

# 30. Class Schedules

Lịch học định kỳ.

Ví dụ:

```text
Thứ 2: 18:00 - 20:00
Thứ 4: 18:00 - 20:00
Thứ 6: 18:00 - 20:00
```

## 30.1 class_schedules

```text
class_schedules
- id BIGINT UNSIGNED PK

- class_subject_id BIGINT UNSIGNED FK

- weekday TINYINT

- start_time TIME
- end_time TIME

- room_id BIGINT UNSIGNED FK NULL

- effective_from DATE
- effective_to DATE NULL

- status ENUM(
    'active',
    'inactive'
  )

- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL

INDEX(class_subject_id, weekday)

INDEX(room_id, weekday)

INDEX(effective_from, effective_to)
```

`weekday`:

```text
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
7 = Sunday
```

---

# 31. Class Sessions

`class_schedules` là lịch định kỳ.

`class_sessions` là từng buổi học thực tế.

Ví dụ:

```text
Schedule:
Thứ 2 18:00 - 20:00

Sessions:
10/08/2026 18:00 - 20:00
17/08/2026 18:00 - 20:00
24/08/2026 18:00 - 20:00
```

## 31.1 class_sessions

```text
class_sessions
- id BIGINT UNSIGNED PK

- class_subject_id BIGINT UNSIGNED FK
- class_schedule_id BIGINT UNSIGNED FK NULL

- teacher_id BIGINT UNSIGNED FK
- room_id BIGINT UNSIGNED FK NULL

- session_date DATE

- start_time TIME
- end_time TIME

- status ENUM(
    'scheduled',
    'completed',
    'cancelled',
    'rescheduled'
  )

- topic VARCHAR(500) NULL
- note TEXT NULL

- created_at DATETIME
- updated_at DATETIME

INDEX(class_subject_id, session_date)

INDEX(teacher_id, session_date)

INDEX(room_id, session_date)

INDEX(status, session_date)
```

Teacher được lưu trực tiếp trong session để đảm bảo lịch sử.

Ví dụ giáo viên ban đầu là Teacher A, nhưng một buổi cụ thể Teacher B dạy thay:

```text
class_subjects.teacher_id = Teacher A

class_sessions.teacher_id = Teacher B
```

---

# 32. Session Reschedules

Lưu lịch sử chuyển lịch.

## 32.1 session_reschedules

```text
session_reschedules
- id BIGINT UNSIGNED PK

- session_id BIGINT UNSIGNED FK

# Old
- old_date DATE
- old_start_time TIME
- old_end_time TIME
- old_room_id BIGINT UNSIGNED FK NULL

# New
- new_date DATE
- new_start_time TIME
- new_end_time TIME
- new_room_id BIGINT UNSIGNED FK NULL

- reason TEXT NULL

- changed_by_admin_id BIGINT UNSIGNED FK NULL
- changed_by_teacher_id BIGINT UNSIGNED FK NULL

- changed_at DATETIME

- created_at DATETIME
- updated_at DATETIME
```

---

# 33. Attendance

Điểm danh theo từng môn và từng buổi.

Không lưu:

```text
class_id
subject_id
date
```

trực tiếp trong attendance.

Chỉ cần:

```text
session_id
student_id
```

## 33.1 attendances

```text
attendances
- id BIGINT UNSIGNED PK

- session_id BIGINT UNSIGNED FK
- student_id BIGINT UNSIGNED FK

- status ENUM(
    'present',
    'absent',
    'late',
    'excused',
    'leave'
  )

- check_in_at DATETIME NULL
- check_out_at DATETIME NULL

- note TEXT NULL

- marked_by_teacher_id BIGINT UNSIGNED FK NULL
- marked_by_admin_id BIGINT UNSIGNED FK NULL

- marked_at DATETIME NULL

- created_at DATETIME
- updated_at DATETIME

UNIQUE(session_id, student_id)

INDEX(student_id, status)
INDEX(session_id, status)
```

---

# 34. Attendance Example

```text
Class Session
Tiếng Trung Sơ cấp
10/08/2026
Teacher A
18:00 - 20:00
```

Attendance:

```text
Student A → Present
Student B → Absent
Student C → Late
Student D → Excused
```

Database:

```text
session_id | student_id | status
--------------------------------
100        | 1          | present
100        | 2          | absent
100        | 3          | late
100        | 4          | excused
```

---

# 35. Exams

Một bài kiểm tra thuộc một `class_subject`.

## 35.1 exams

```text
exams
- id BIGINT UNSIGNED PK

- class_subject_id BIGINT UNSIGNED FK

- name VARCHAR(255)

- description TEXT NULL

- exam_date DATE
- start_time TIME NULL
- end_time TIME NULL

- max_score DECIMAL(5,2) DEFAULT 10

- status ENUM(
    'draft',
    'published',
    'completed',
    'cancelled'
  )

- created_by_teacher_id BIGINT UNSIGNED FK NULL
- created_by_admin_id BIGINT UNSIGNED FK NULL

- created_at DATETIME
- updated_at DATETIME
- deleted_at DATETIME NULL

INDEX(class_subject_id, exam_date)
INDEX(status, exam_date)
```

---

# 36. Exam Results

Điểm của từng học sinh.

## 36.1 exam_results

```text
exam_results
- id BIGINT UNSIGNED PK

- exam_id BIGINT UNSIGNED FK
- student_id BIGINT UNSIGNED FK

- score DECIMAL(5,2) NULL

- grade VARCHAR(20) NULL

- comment TEXT NULL

- entered_by_teacher_id BIGINT UNSIGNED FK NULL
- entered_by_admin_id BIGINT UNSIGNED FK NULL

- entered_at DATETIME NULL

- updated_by_teacher_id BIGINT UNSIGNED FK NULL
- updated_by_admin_id BIGINT UNSIGNED FK NULL

- created_at DATETIME
- updated_at DATETIME

UNIQUE(exam_id, student_id)

INDEX(student_id)
INDEX(exam_id)
```

---

# 37. Exam Result History

Lưu lịch sử thay đổi điểm.

## 37.1 exam_result_histories

```text
exam_result_histories
- id BIGINT UNSIGNED PK

- exam_result_id BIGINT UNSIGNED FK

- old_score DECIMAL(5,2) NULL
- new_score DECIMAL(5,2) NULL

- old_comment TEXT NULL
- new_comment TEXT NULL

- changed_by_teacher_id BIGINT UNSIGNED FK NULL
- changed_by_admin_id BIGINT UNSIGNED FK NULL

- reason TEXT NULL

- created_at DATETIME
```

---

# 38. Student Notes

## 38.1 student_notes

```text
student_notes
- id BIGINT UNSIGNED PK

- student_id BIGINT UNSIGNED FK

- content TEXT

- created_by_admin_id BIGINT UNSIGNED FK NULL
- created_by_teacher_id BIGINT UNSIGNED FK NULL

- created_at DATETIME
- updated_at DATETIME
```

---

# 39. Student Documents

## 39.1 student_documents

```text
student_documents
- id BIGINT UNSIGNED PK

- student_id BIGINT UNSIGNED FK

- document_type VARCHAR(100)

- file_name VARCHAR(255)
- file_path VARCHAR(500)

- mime_type VARCHAR(100) NULL
- file_size BIGINT NULL

- uploaded_by_admin_id BIGINT UNSIGNED FK NULL
- uploaded_by_teacher_id BIGINT UNSIGNED FK NULL

- created_at DATETIME
- updated_at DATETIME
```

---

# 40. Notifications

## 40.1 notifications

```text
notifications
- id BIGINT UNSIGNED PK

- center_id BIGINT UNSIGNED FK NULL

- title VARCHAR(255)
- content TEXT

- type VARCHAR(100) NULL

- created_by_admin_id BIGINT UNSIGNED FK NULL
- created_by_teacher_id BIGINT UNSIGNED FK NULL

- created_at DATETIME
- updated_at DATETIME
```

## 40.2 notification_recipients

Không sử dụng users.

```text
notification_recipients
- id BIGINT UNSIGNED PK

- notification_id BIGINT UNSIGNED FK

- recipient_type ENUM(
    'admin',
    'teacher',
    'student'
  )

- recipient_id BIGINT UNSIGNED

- read_at DATETIME NULL

- created_at DATETIME
- updated_at DATETIME

INDEX(recipient_type, recipient_id)
INDEX(notification_id)
```

---

# 41. Roles

## 41.1 roles

```text
roles
- id BIGINT UNSIGNED PK

- code VARCHAR(50)
- name VARCHAR(100)

- description TEXT NULL

- created_at DATETIME
- updated_at DATETIME

UNIQUE(code)
```

Ví dụ:

```text
super_admin
center_admin
staff
teacher
student
```

---

# 42. Permissions

## 42.1 permissions

```text
permissions
- id BIGINT UNSIGNED PK

- code VARCHAR(100)
- name VARCHAR(255)

- description TEXT NULL

- created_at DATETIME
- updated_at DATETIME

UNIQUE(code)
```

Ví dụ:

```text
center.view
center.create
center.update
center.delete

student.view
student.create
student.update
student.delete

teacher.view
teacher.create
teacher.update
teacher.delete

class.view
class.create
class.update
class.delete

attendance.view
attendance.create
attendance.update

exam.view
exam.create
exam.update

exam_result.view
exam_result.create
exam_result.update
```

---

# 43. Role Permissions

## 43.1 role_permissions

```text
role_permissions
- id BIGINT UNSIGNED PK

- role_id BIGINT UNSIGNED FK
- permission_id BIGINT UNSIGNED FK

- created_at DATETIME
- updated_at DATETIME

UNIQUE(role_id, permission_id)
```

---

# 44. Admin Roles

## 44.1 admin_roles

```text
admin_roles
- id BIGINT UNSIGNED PK

- admin_id BIGINT UNSIGNED FK
- role_id BIGINT UNSIGNED FK

- created_at DATETIME
- updated_at DATETIME

UNIQUE(admin_id, role_id)
```

---

# 45. Teacher Roles

## 45.1 teacher_roles

```text
teacher_roles
- id BIGINT UNSIGNED PK

- teacher_id BIGINT UNSIGNED FK
- role_id BIGINT UNSIGNED FK

- created_at DATETIME
- updated_at DATETIME

UNIQUE(teacher_id, role_id)
```

---

# 46. Student Roles

## 46.1 student_roles

```text
student_roles
- id BIGINT UNSIGNED PK

- student_id BIGINT UNSIGNED FK
- role_id BIGINT UNSIGNED FK

- created_at DATETIME
- updated_at DATETIME

UNIQUE(student_id, role_id)
```

---

# 47. Optional Direct Permissions

Không cần nếu hệ thống chỉ sử dụng Role → Permission.

Nếu cần cấp quyền riêng cho từng account thì có thể thêm:

```text
admin_permissions
teacher_permissions
student_permissions
```

Nhưng giai đoạn đầu **không nên tạo** để database đơn giản.

---

# 48. Admin Portal

Admin có thể quản lý:

```text
Dashboard

Centers

Admins
Teachers
Students

Subjects
Center Subjects

Rooms

Classes
Class Students
Class Subjects

Schedules
Sessions
Session Reschedules

Attendance

Exams
Exam Results

Notifications

Roles
Permissions

Devices / Login Sessions
```

---

# 49. Teacher Portal

Teacher có thể:

```text
Dashboard

My Profile

My Classes

My Subjects

My Schedule

Today's Sessions

Attendance

Attendance History

Exams

Exam Results

My Devices
```

API:

```text
GET  /api/teacher/me

GET  /api/teacher/classes

GET  /api/teacher/subjects

GET  /api/teacher/schedule

GET  /api/teacher/sessions

GET  /api/teacher/sessions/{session}/students

POST /api/teacher/sessions/{session}/attendance

GET  /api/teacher/attendance-history

GET  /api/teacher/exams

POST /api/teacher/exams

PUT  /api/teacher/exams/{exam}

GET  /api/teacher/exams/{exam}/results

POST /api/teacher/exams/{exam}/results

PUT  /api/teacher/exam-results/{result}
```

Teacher chỉ được thao tác trên môn mình dạy:

```text
class_subjects.teacher_id = current_teacher_id
```

---

# 50. Student Portal

Student có thể:

```text
Dashboard

My Profile

My Classes

My Subjects

My Schedule

Attendance History

Exams

Exam Results

My Devices
```

API:

```text
GET /api/student/me

GET /api/student/classes

GET /api/student/subjects

GET /api/student/schedule

GET /api/student/sessions

GET /api/student/attendance

GET /api/student/exams

GET /api/student/exam-results

GET /api/student/devices

DELETE /api/student/devices/{id}
```

Student chỉ được xem dữ liệu của chính mình.

Không tin:

```text
student_id
```

từ frontend.

Backend lấy:

```text
current authenticated student
```

---

# 51. Admin Authentication API

```text
POST /api/admin/login

POST /api/admin/refresh

POST /api/admin/logout

POST /api/admin/logout-all

GET /api/admin/me

GET /api/admin/devices

DELETE /api/admin/devices/{id}
```

---

# 52. Teacher Authentication API

```text
POST /api/teacher/login

POST /api/teacher/refresh

POST /api/teacher/logout

POST /api/teacher/logout-all

GET /api/teacher/me

GET /api/teacher/devices

DELETE /api/teacher/devices/{id}
```

---

# 53. Student Authentication API

```text
POST /api/student/login

POST /api/student/refresh

POST /api/student/logout

POST /api/student/logout-all

GET /api/student/me

GET /api/student/devices

DELETE /api/student/devices/{id}
```

---

# 54. Login Response

Tất cả loại account dùng format thống nhất.

```json
{
    "access_token": "ACCESS_TOKEN",
    "refresh_token": "REFRESH_TOKEN",
    "token_type": "Bearer",
    "expires_in": 1800
}
```

`expires_in`:

```text
1800 = 30 minutes
```

---

# 55. Refresh Response

```json
{
    "access_token": "NEW_ACCESS_TOKEN",
    "refresh_token": "NEW_REFRESH_TOKEN",
    "token_type": "Bearer",
    "expires_in": 1800
}
```

Refresh token cũ bị revoke.

---

# 56. Authentication Middleware

Flow:

```text
Request
   │
   ▼
Authorization Header
   │
   ▼
Access Token
   │
   ▼
Authentication Middleware
   │
   ├── Validate token
   ├── Identify account type
   ├── Identify account ID
   ├── Check account status
   │
   ▼
Permission Middleware
   │
   ▼
Controller
```

---

# 57. Multi-Center Security

Admin có thể được cấp quyền trên nhiều center.

```text
admin_centers
```

Ví dụ:

```text
Admin A
├── Center Hanoi
├── Center HCM
└── Center Da Nang
```

Teacher chỉ thuộc một center:

```text
teachers.center_id
```

Student chỉ thuộc một center:

```text
students.center_id
```

Backend phải kiểm tra center khi truy cập dữ liệu.

Không chỉ kiểm tra:

```text
class_id
```

mà phải kiểm tra:

```text
class.center_id
=
current user's allowed center
```

---

# 58. Important Business Rules

## Rule 1 - Không có users

```text
admins
teachers
students
```

là account chính.

---

## Rule 2 - Multi-device login

Một account có thể có:

```text
1 account
N devices
N refresh token sessions
```

Không giới hạn số thiết bị ở database level.

Nếu muốn giới hạn số thiết bị, xử lý bằng business logic.

Ví dụ:

```text
Maximum 5 devices/account
```

---

## Rule 3 - Mỗi thiết bị có refresh token riêng

```text
Student
│
├── iPhone → Refresh Token A
├── Laptop → Refresh Token B
└── iPad   → Refresh Token C
```

---

## Rule 4 - Logout current device

Chỉ revoke:

```text
current refresh token
```

---

## Rule 5 - Logout all

Revoke tất cả refresh token của account.

---

## Rule 6 - Refresh token rotation

Mỗi lần refresh:

```text
Old Token
    ↓
Revoke
    ↓
New Token
```

---

## Rule 7 - Subject

Không có:

```text
subject_levels
```

Tên môn chứa luôn cấp độ.

Ví dụ:

```text
Toán 12
Tiếng Trung Sơ cấp
Tiếng Trung Trung cấp
```

---

## Rule 8 - Center Subject

`center_subjects` dùng để center tùy chỉnh:

```text
code
name
total_sessions
duration_minutes
tuition_fee
```

---

## Rule 9 - Class

Một center có nhiều class.

---

## Rule 10 - Class Student

Không lưu:

```text
students.class_id
```

Dùng:

```text
class_students
```

để lưu lịch sử chuyển lớp.

---

## Rule 11 - Class Subject

Một class có nhiều subject.

Mỗi class subject có một teacher.

```text
class_subjects.teacher_id
```

---

## Rule 12 - Schedule

`class_schedules` là lịch định kỳ.

---

## Rule 13 - Session

`class_sessions` là buổi học thực tế.

---

## Rule 14 - Attendance

Attendance thuộc:

```text
session + student
```

---

## Rule 15 - Exam

Exam thuộc:

```text
class_subject
```

---

## Rule 16 - Exam Result

Exam result thuộc:

```text
exam + student
```

---

## Rule 17 - Teacher

Teacher chỉ được:

```text
view/update
```

các class subject mà mình phụ trách.

---

## Rule 18 - Student

Student chỉ được xem:

```text
own schedule
own attendance
own exam results
```

---

# 59. Main Relationship

```text
                         CENTERS
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
         TEACHERS        STUDENTS        CLASSES
             │              │              │
             │              │       ┌──────┴──────┐
             │              │       │             │
             │              │       ▼             ▼
             │              │ CLASS_STUDENTS  CLASS_SUBJECTS
             │              │                     │
             │              │              ┌──────┼──────┐
             │              │              │      │      │
             │              │              ▼      ▼      ▼
             │              │       CENTER_SUBJECT TEACHER
             │              │              │
             │              │              ▼
             │              │          SUBJECTS
             │              │
             │              │
             │              └───────────────┐
             │                              │
             └──────────────────────────────┘
                                           
CLASS_SUBJECTS
      │
      ├── CLASS_SCHEDULES
      │
      │       └── CLASS_SESSIONS
      │                 │
      │                 ▼
      │             ATTENDANCES
      │
      └── EXAMS
            │
            ▼
        EXAM_RESULTS
            │
            ▼
         STUDENTS
```

---

# 60. Authentication Relationship

```text
                       ACCOUNTS
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          ADMINS        TEACHERS       STUDENTS
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                    REFRESH_TOKENS
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
           iPhone        Laptop       Android
           Session       Session       Session
```

---

# 61. Complete Table List

## Authentication / Accounts

```text
admins
teachers
students
refresh_tokens
```

## Centers

```text
centers
admin_centers
rooms
```

## Subjects

```text
subjects
center_subjects
```

## Classes

```text
classes
class_students
class_subjects
```

## Schedule

```text
class_schedules
class_sessions
session_reschedules
```

## Attendance

```text
attendances
```

## Exams

```text
exams
exam_results
exam_result_histories
```

## Student Data

```text
student_notes
student_documents
```

## Notifications

```text
notifications
notification_recipients
```

## Authorization

```text
roles
permissions
role_permissions

admin_roles
teacher_roles
student_roles
```

---

# 62. Tables NOT to Create

Không tạo:

```text
users
subject_levels
parents
student_parents
```

Không lưu token trực tiếp trong:

```text
admins.refresh_token
teachers.refresh_token
students.refresh_token
```

Không lưu:

```text
students.class_id
```

Không lưu:

```text
classes.subject_id
classes.teacher_id
```

Không lưu attendance trực tiếp bằng:

```text
attendance.class_id
attendance.subject_id
```

---

# 63. Recommended Migration Order

```text
01_create_centers_table

02_create_admins_table
03_create_teachers_table
04_create_students_table

05_create_refresh_tokens_table

06_create_admin_centers_table

07_create_subjects_table
08_create_center_subjects_table

09_create_rooms_table

10_create_classes_table
11_create_class_students_table
12_create_class_subjects_table

13_create_class_schedules_table
14_create_class_sessions_table
15_create_session_reschedules_table

16_create_attendances_table

17_create_exams_table
18_create_exam_results_table
19_create_exam_result_histories_table

20_create_student_notes_table
21_create_student_documents_table

22_create_notifications_table
23_create_notification_recipients_table

24_create_roles_table
25_create_permissions_table
26_create_role_permissions_table

27_create_admin_roles_table
28_create_teacher_roles_table
29_create_student_roles_table

30_create_center_subscriptions_table
31_create_payment_transactions_table
```

---

# 64. Final Architecture Summary

```text
MULTI CENTER
│
├── CENTER
│   │
│   ├── ADMIN
│   │
│   ├── TEACHER
│   │
│   ├── STUDENT
│   │
│   ├── ROOM
│   │
│   └── CLASS
│       │
│       ├── STUDENTS
│       │
│       └── SUBJECTS
│           │
│           └── TEACHER
│               │
│               ├── SCHEDULE
│               │
│               └── SESSION
│                   │
│                   └── ATTENDANCE
│
├── SUBJECT
│   │
│   └── CENTER_SUBJECT
│
├── EXAM
│   │
│   └── EXAM_RESULT
│
├── ROLE
│   │
│   └── PERMISSION
│
└── AUTHENTICATION
    │
    ├── ADMIN
    ├── TEACHER
    └── STUDENT
         │
         ├── Device 1
         ├── Device 2
         ├── Device 3
         └── ...
```

## Core principles

```text
1. Không có bảng users.

2. admins, teachers, students là account chính.

3. Một account được login đồng thời trên nhiều thiết bị.

4. Mỗi device/login session có một refresh token riêng.

5. Refresh token lưu dạng hash.

6. Access token có lifetime ngắn.

7. Refresh token có lifetime dài.

8. Refresh token phải rotation.

9. Logout một device không ảnh hưởng device khác.

10. Logout-all revoke toàn bộ session.

11. Không có subject_levels.

12. Tên subject đã chứa cấp độ/chương trình.

13. center_subjects lưu cấu hình môn của từng center.

14. Một center có nhiều class.

15. Một class có nhiều student.

16. Một class có nhiều subject.

17. Mỗi class_subject có một teacher.

18. Schedule là lịch định kỳ.

19. Session là buổi học thực tế.

20. Attendance = session + student.

21. Exam = class_subject.

22. Exam Result = exam + student.

23. Teacher chỉ thao tác dữ liệu mình phụ trách.

24. Student chỉ xem dữ liệu của chính mình.

25. Admin có thể quản lý một hoặc nhiều center.

26. Chuyển lớp phải giữ lịch sử.

27. Chuyển lịch học phải giữ lịch sử.

28. Trung tâm hết hạn (expires_at < NOW()) sẽ bị tạm khóa các thao tác nghiệp vụ chính.

29. Thanh toán qua ZaloPay hỗ trợ tự động gia hạn trung tâm khi nhận Callback thành công.
```
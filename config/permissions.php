<?php

return [
    /*
    |--------------------------------------------------------------------------
    | System Permissions Master Configuration
    |--------------------------------------------------------------------------
    |
    | File cấu hình nguồn sự thật (Single Source of Truth) cho toàn bộ quyền
    | trong hệ thống. Khi thêm tính năng/trang mới, chỉ cần khai báo vào đây
    | và chạy `php artisan permission:sync` để tự động cập nhật Database.
    |
    */

    'modules' => [
        [
            'key'          => 'dashboard',
            'name'         => 'Bảng Điều Khiển & Thống Kê',
            'module_order' => 1,
            'actions'      => [
                ['code' => 'dashboard.index', 'action' => 'index', 'name' => 'Xem bảng điều khiển', 'description' => 'Truy cập trang tổng quan Dashboard'],
                ['code' => 'statistics.index', 'action' => 'index', 'name' => 'Xem thống kê báo cáo', 'description' => 'Xem biểu đồ thống kê báo cáo chi tiết'],
            ],
        ],
        [
            'key'          => 'centers',
            'name'         => 'Quản Trị Trung Tâm',
            'module_order' => 2,
            'actions'      => [
                ['code' => 'centers.index', 'action' => 'index', 'name' => 'Xem danh sách trung tâm', 'description' => 'Xem danh sách các trung tâm trên hệ thống'],
                ['code' => 'centers.create', 'action' => 'create', 'name' => 'Thêm mới trung tâm', 'description' => 'Tạo mới trung tâm đào tạo'],
                ['code' => 'centers.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa trung tâm', 'description' => 'Cập nhật thông tin trung tâm'],
                ['code' => 'centers.delete', 'action' => 'delete', 'name' => 'Xóa trung tâm', 'description' => 'Xóa bỏ trung tâm khỏi hệ thống'],
            ],
        ],
        [
            'key'          => 'admins',
            'name'         => 'Quản Trị Viên',
            'module_order' => 3,
            'actions'      => [
                ['code' => 'admins.index', 'action' => 'index', 'name' => 'Xem danh sách quản trị viên', 'description' => 'Xem danh sách các tài khoản admin'],
                ['code' => 'admins.create', 'action' => 'create', 'name' => 'Thêm mới quản trị viên', 'description' => 'Tạo tài khoản quản trị viên'],
                ['code' => 'admins.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa quản trị viên', 'description' => 'Cập nhật thông tin admin'],
                ['code' => 'admins.delete', 'action' => 'delete', 'name' => 'Xóa quản trị viên', 'description' => 'Xóa tài khoản admin phụ'],
            ],
        ],
        [
            'key'          => 'plans',
            'name'         => 'Gói Dịch Vụ SaaS',
            'module_order' => 4,
            'actions'      => [
                ['code' => 'plans.index', 'action' => 'index', 'name' => 'Xem danh sách gói dịch vụ', 'description' => 'Xem các gói cước SaaS'],
                ['code' => 'plans.create', 'action' => 'create', 'name' => 'Thêm mới gói dịch vụ', 'description' => 'Tạo gói cước dịch vụ mới'],
                ['code' => 'plans.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa gói dịch vụ', 'description' => 'Cập nhật cấu hình gói cước'],
                ['code' => 'plans.delete', 'action' => 'delete', 'name' => 'Xóa gói dịch vụ', 'description' => 'Xóa gói cước dịch vụ'],
            ],
        ],
        [
            'key'          => 'permissions',
            'name'         => 'Phân Quyền Hệ Thống',
            'module_order' => 5,
            'actions'      => [
                ['code' => 'permissions.index', 'action' => 'index', 'name' => 'Xem ma trận phân quyền', 'description' => 'Xem ma trận quyền theo từng vai trò'],
                ['code' => 'permissions.edit', 'action' => 'edit', 'name' => 'Cập nhật gán quyền', 'description' => 'Bật/tắt phân quyền cho vai trò'],
            ],
        ],
        [
            'key'          => 'teachers',
            'name'         => 'Quản Lý Giáo Viên',
            'module_order' => 6,
            'actions'      => [
                ['code' => 'teachers.index', 'action' => 'index', 'name' => 'Xem danh sách giáo viên', 'description' => 'Xem danh sách giáo viên'],
                ['code' => 'teachers.create', 'action' => 'create', 'name' => 'Thêm mới giáo viên', 'description' => 'Tạo mới giáo viên & import CSV'],
                ['code' => 'teachers.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa giáo viên', 'description' => 'Cập nhật hồ sơ giáo viên'],
                ['code' => 'teachers.delete', 'action' => 'delete', 'name' => 'Xóa giáo viên', 'description' => 'Xóa giáo viên khỏi hệ thống'],
            ],
        ],
        [
            'key'          => 'students',
            'name'         => 'Quản Lý Học Sinh',
            'module_order' => 7,
            'actions'      => [
                ['code' => 'students.index', 'action' => 'index', 'name' => 'Xem danh sách học sinh', 'description' => 'Xem danh sách học sinh'],
                ['code' => 'students.create', 'action' => 'create', 'name' => 'Thêm mới học sinh', 'description' => 'Tạo mới học sinh & import CSV'],
                ['code' => 'students.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa học sinh', 'description' => 'Cập nhật hồ sơ học sinh'],
                ['code' => 'students.delete', 'action' => 'delete', 'name' => 'Xóa học sinh', 'description' => 'Xóa học sinh khỏi hệ thống'],
            ],
        ],
        [
            'key'          => 'subjects',
            'name'         => 'Quản Lý Môn Học',
            'module_order' => 8,
            'actions'      => [
                ['code' => 'subjects.index', 'action' => 'index', 'name' => 'Xem danh sách môn học', 'description' => 'Xem danh sách môn học'],
                ['code' => 'subjects.create', 'action' => 'create', 'name' => 'Thêm mới môn học', 'description' => 'Tạo mới môn học'],
                ['code' => 'subjects.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa môn học', 'description' => 'Cập nhật thông tin môn học'],
                ['code' => 'subjects.delete', 'action' => 'delete', 'name' => 'Xóa môn học', 'description' => 'Xóa môn học'],
            ],
        ],
        [
            'key'          => 'rooms',
            'name'         => 'Quản Lý Phòng Học',
            'module_order' => 9,
            'actions'      => [
                ['code' => 'rooms.index', 'action' => 'index', 'name' => 'Xem danh sách phòng học', 'description' => 'Xem danh sách phòng học'],
                ['code' => 'rooms.create', 'action' => 'create', 'name' => 'Thêm mới phòng học', 'description' => 'Tạo mới phòng học'],
                ['code' => 'rooms.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa phòng học', 'description' => 'Cập nhật thông tin phòng học'],
                ['code' => 'rooms.delete', 'action' => 'delete', 'name' => 'Xóa phòng học', 'description' => 'Xóa phòng học'],
            ],
        ],
        [
            'key'          => 'classes',
            'name'         => 'Quản Lý Lớp Học',
            'module_order' => 10,
            'actions'      => [
                ['code' => 'classes.index', 'action' => 'index', 'name' => 'Xem danh sách lớp học', 'description' => 'Xem danh sách các lớp học'],
                ['code' => 'classes.create', 'action' => 'create', 'name' => 'Thêm mới lớp học', 'description' => 'Tạo mới lớp học'],
                ['code' => 'classes.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa lớp học', 'description' => 'Cập nhật thông tin lớp học'],
                ['code' => 'classes.delete', 'action' => 'delete', 'name' => 'Xóa lớp học', 'description' => 'Xóa lớp học'],
                ['code' => 'classes.students', 'action' => 'index', 'name' => 'Quản lý học sinh lớp', 'description' => 'Xem & thêm học sinh vào lớp'],
                ['code' => 'classes.chat', 'action' => 'index', 'name' => 'Chat nhóm lớp học', 'description' => 'Tham gia nhóm chat trao đổi của lớp'],
            ],
        ],
        [
            'key'          => 'schedules',
            'name'         => 'Thời Khóa Biểu & Lịch Học',
            'module_order' => 11,
            'actions'      => [
                ['code' => 'schedules.index', 'action' => 'index', 'name' => 'Xem thời khóa biểu', 'description' => 'Xem lịch học các lớp'],
                ['code' => 'schedules.create', 'action' => 'create', 'name' => 'Thêm mới lịch học', 'description' => 'Tạo lịch học cố định'],
                ['code' => 'schedules.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa lịch học', 'description' => 'Cập nhật lịch học'],
                ['code' => 'schedules.delete', 'action' => 'delete', 'name' => 'Xóa lịch học', 'description' => 'Xóa lịch học cố định'],
            ],
        ],
        [
            'key'          => 'sessions',
            'name'         => 'Quản Lý Ca Học & Điểm Danh',
            'module_order' => 12,
            'actions'      => [
                ['code' => 'sessions.index', 'action' => 'index', 'name' => 'Xem danh sách buổi học', 'description' => 'Xem danh sách các buổi học'],
                ['code' => 'sessions.edit', 'action' => 'edit', 'name' => 'Đổi lịch & báo nghỉ', 'description' => 'Đổi lịch ca học, xếp dạy bù'],
                ['code' => 'attendance.index', 'action' => 'index', 'name' => 'Xem điểm danh ca học', 'description' => 'Xem bảng điểm danh'],
                ['code' => 'attendance.save', 'action' => 'edit', 'name' => 'Điểm danh học sinh', 'description' => 'Thực hiện điểm danh buổi học'],
            ],
        ],
        [
            'key'          => 'holidays',
            'name'         => 'Quản Lý Ngày Lễ',
            'module_order' => 13,
            'actions'      => [
                ['code' => 'holidays.index', 'action' => 'index', 'name' => 'Xem danh sách ngày lễ', 'description' => 'Xem lịch nghỉ lễ'],
                ['code' => 'holidays.create', 'action' => 'create', 'name' => 'Thêm mới ngày lễ', 'description' => 'Tạo mới hoặc seed ngày lễ'],
                ['code' => 'holidays.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa ngày lễ', 'description' => 'Cập nhật ngày lễ'],
                ['code' => 'holidays.delete', 'action' => 'delete', 'name' => 'Xóa ngày lễ', 'description' => 'Xóa ngày nghỉ lễ'],
            ],
        ],
        [
            'key'          => 'exams',
            'name'         => 'Kho Đề Thi',
            'module_order' => 14,
            'actions'      => [
                ['code' => 'exams.index', 'action' => 'index', 'name' => 'Xem kho đề thi', 'description' => 'Xem danh sách đề thi'],
                ['code' => 'exams.create', 'action' => 'create', 'name' => 'Tạo mới đề thi', 'description' => 'Tạo đề thi & câu hỏi trắc nghiệm/tự luận/audio'],
                ['code' => 'exams.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa đề thi', 'description' => 'Cập nhật nội dung đề thi'],
                ['code' => 'exams.delete', 'action' => 'delete', 'name' => 'Xóa đề thi', 'description' => 'Xóa đề thi'],
            ],
        ],
        [
            'key'          => 'exam-types',
            'name'         => 'Loại Đề Thi',
            'module_order' => 15,
            'actions'      => [
                ['code' => 'exam-types.index', 'action' => 'index', 'name' => 'Xem danh sách loại đề', 'description' => 'Xem danh mục loại đề thi'],
                ['code' => 'exam-types.create', 'action' => 'create', 'name' => 'Thêm loại đề thi', 'description' => 'Tạo mới loại đề thi'],
                ['code' => 'exam-types.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa loại đề thi', 'description' => 'Cập nhật loại đề thi'],
                ['code' => 'exam-types.delete', 'action' => 'delete', 'name' => 'Xóa loại đề thi', 'description' => 'Xóa loại đề thi'],
            ],
        ],
        [
            'key'          => 'class-exams',
            'name'         => 'Kỳ Thi Lớp & Chấm Điểm',
            'module_order' => 16,
            'actions'      => [
                ['code' => 'class-exams.index', 'action' => 'index', 'name' => 'Xem kỳ thi lớp học', 'description' => 'Xem danh sách kỳ thi được giao'],
                ['code' => 'class-exams.create', 'action' => 'create', 'name' => 'Giao đề thi cho lớp', 'description' => 'Tổ chức thi cho lớp học'],
                ['code' => 'class-exams.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa kỳ thi lớp', 'description' => 'Cập nhật thời gian & cấu hình thi'],
                ['code' => 'class-exams.delete', 'action' => 'delete', 'name' => 'Hủy kỳ thi lớp', 'description' => 'Hủy bỏ kỳ thi lớp'],
                ['code' => 'grading.index', 'action' => 'index', 'name' => 'Xem danh sách chấm bài', 'description' => 'Xem bài nộp cần chấm điểm'],
                ['code' => 'grading.grade', 'action' => 'edit', 'name' => 'Chấm điểm bài thi', 'description' => 'Chấm điểm tự luận/nói/viết'],
            ],
        ],
        [
            'key'          => 'online-exam',
            'name'         => 'Phòng Thi & Luyện Tập Trực Tuyến',
            'module_order' => 17,
            'actions'      => [
                ['code' => 'online-exam.enter', 'action' => 'index', 'name' => 'Vào phòng thi trực tuyến', 'description' => 'Nhập mã thi và tham gia phòng thi trực tuyến'],
                ['code' => 'practice-exams.index', 'action' => 'index', 'name' => 'Luyện tập & Thi thử', 'description' => 'Xem & làm bài thi thử trực tuyến'],
            ],
        ],
        [
            'key'          => 'tuitions',
            'name'         => 'Quản Lý Học Phí & Thu Tiền',
            'module_order' => 18,
            'actions'      => [
                ['code' => 'tuitions.index', 'action' => 'index', 'name' => 'Xem danh sách học phí', 'description' => 'Xem bảng theo dõi học phí học sinh'],
                ['code' => 'tuitions.create', 'action' => 'create', 'name' => 'Tạo khoản học phí mới', 'description' => 'Lập phiếu thu học phí cho học sinh'],
                ['code' => 'tuitions.edit', 'action' => 'edit', 'name' => 'Chỉnh sửa học phí', 'description' => 'Cập nhật số tiền/hạn nộp học phí'],
                ['code' => 'tuitions.delete', 'action' => 'delete', 'name' => 'Xóa khoản học phí', 'description' => 'Xóa khoản học phí'],
                ['code' => 'tuitions.payments', 'action' => 'edit', 'name' => 'Thu tiền & đợt đóng', 'description' => 'Ghi nhận đợt nộp học phí'],
            ],
        ],
    ],
];

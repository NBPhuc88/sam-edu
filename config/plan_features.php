<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Subscription Plan Features Mapping
    |--------------------------------------------------------------------------
    |
    | Định nghĩa ánh xạ giữa feature code trong gói dịch vụ (allowed_features)
    | và các route/action được bảo vệ trong hệ thống.
    |
    */

    'features' => [
        'export_csv' => [
            'name'           => 'Công cụ Xuất/Nhập CSV',
            'description'    => 'Xuất danh sách giáo viên, học sinh, nhập danh sách từ CSV và tải file mẫu',
            'route_actions'  => ['export', 'import', 'sample-csv', 'download-sample'],
            'route_suffixes' => ['.export', '.import', '.sample-csv', '.download-sample'],
        ],
        'exams' => [
            'name'           => 'Kho đề thi',
            'description'    => 'Quản lý và soạn thảo kho đề thi',
            'route_prefixes' => ['exams.'],
        ],
        'class-exams' => [
            'name'           => 'Kỳ thi lớp học',
            'description'    => 'Giao bài thi và tổ chức thi cho lớp học',
            'route_prefixes' => ['class-exams.'],
        ],
        'grading' => [
            'name'           => 'Chấm điểm bài thi',
            'description'    => 'Chấm bài thi tự luận, âm thanh và quản lý điểm số',
            'route_prefixes' => ['grading.'],
        ],
        'online-exam' => [
            'name'           => 'Phòng thi trực tuyến',
            'description'    => 'Tham gia phòng thi và làm bài trực tuyến',
            'route_prefixes' => ['online-exam.'],
        ],
        'practice-exams' => [
            'name'           => 'Luyện tập & Thi thử',
            'description'    => 'Tham gia luyện tập và thi thử đề thi công khai',
            'route_prefixes' => ['practice-exams.'],
        ],
        'chat' => [
            'name'        => 'Chat nhóm lớp học',
            'description' => 'Trao đổi tin nhắn và tài liệu trong nhóm lớp học',
            'route_names' => [
                'chats.index',
                'classes.chat.index',
                'classes.chat.messages',
                'classes.chat.send',
                'classes.chat.pin',
            ],
            'route_prefixes' => ['chats.', 'classes.chat.'],
        ],
    ],
];

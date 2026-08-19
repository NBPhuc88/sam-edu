export type QuestionType =
    | 'single_choice'
    | 'multiple_choice'
    | 'true_false_not_given'
    | 'fill_in_blank'
    | 'matching'
    | 'ordering'
    | 'diagram_labelling'
    | 'find_mistake'
    | 'essay'
    | 'audio_record';

export interface QuestionTypeMeta {
    type: QuestionType;
    label: string;
    description: string;
    badgeColor: string;
    iconName: string;
    autoGraded: boolean;
}

export const QUESTION_TYPES: QuestionTypeMeta[] = [
    {
        type: 'single_choice',
        label: 'Trắc nghiệm 1 đáp án',
        description: 'Chọn 1 đáp án đúng duy nhất trong danh sách lựa chọn A, B, C, D',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        iconName: 'CheckCircle2',
        autoGraded: true,
    },
    {
        type: 'multiple_choice',
        label: 'Trắc nghiệm nhiều đáp án',
        description: 'Chọn từ 2 hoặc nhiều đáp án đúng (Pick 2 out of 5...)',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        iconName: 'ListChecks',
        autoGraded: true,
    },
    {
        type: 'true_false_not_given',
        label: 'Đúng / Sai / Không đề cập',
        description: 'Dạng IELTS True/False/Not Given, Yes/No/Not Given, HSK Đúng/Sai',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconName: 'HelpCircle',
        autoGraded: true,
    },
    {
        type: 'fill_in_blank',
        label: 'Điền vào chỗ trống',
        description: 'Điền từ vào các vị trí [blank_1], [blank_2] trong đoạn văn',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        iconName: 'FileText',
        autoGraded: true,
    },
    {
        type: 'matching',
        label: 'Nối cặp / Ghép tiêu đề',
        description: 'Ghép nối thông tin giữa 2 cột (Ghép tiêu đề, ghép tranh, nối từ)',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        iconName: 'GitMerge',
        autoGraded: true,
    },
    {
        type: 'ordering',
        label: 'Sắp xếp thứ tự / Ghép câu',
        description: 'Sắp xếp các mẩu từ xáo trộn thành câu hoàn chỉnh hoặc sắp xếp đoạn',
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        iconName: 'ArrowUpDown',
        autoGraded: true,
    },
    {
        type: 'diagram_labelling',
        label: 'Gán nhãn sơ đồ / Bản đồ',
        description: 'Gán các địa danh / bộ phận vào các vị trí ghim A, B, C... trên sơ đồ',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        iconName: 'MapPin',
        autoGraded: true,
    },
    {
        type: 'find_mistake',
        label: 'Tìm lỗi sai trong câu',
        description: 'Chọn 1 trong các phần gạch chân A, B, C, D bị sai ngữ pháp',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        iconName: 'AlertTriangle',
        autoGraded: true,
    },
    {
        type: 'essay',
        label: 'Tự luận / Viết bài văn',
        description: 'Học sinh viết đoạn văn / bài văn dài, giáo viên chấm theo Rubrics',
        badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
        iconName: 'PenTool',
        autoGraded: false,
    },
    {
        type: 'audio_record',
        label: 'Ghi âm trả lời / Speaking',
        description: 'Học sinh thu âm câu trả lời trực tiếp từ micro trình duyệt',
        badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
        iconName: 'Mic',
        autoGraded: false,
    },
];

export interface ExamQuestionData {
    id?: number;
    code?: string;
    question_type: QuestionType;
    content: string;
    score: number | string;
    image_url?: string | null;
    audio_url?: string | null;
    options?: any;
    correct_answer?: any;
    explanation?: string | null;
    metadata?: any;
    order_index?: number;
}

export interface Center {
    id: number;
    name: string;
    code: string;
}

export interface SchoolClass {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

export interface Exam {
    id: number;
    center_id: number;
    class_id: number | null;
    subject_id: number | null;
    code: string;
    name: string;
    exam_type: 'general' | 'ielts' | 'hsk' | 'toeic' | 'custom';
    duration_minutes: number | null;
    max_score: number | string;
    pass_score: number | string | null;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    max_attempts: number;
    description: string | null;
    exam_date: string | null;
    start_time: string | null;
    end_time: string | null;
    status: 'draft' | 'published' | 'completed' | 'cancelled';
    created_at?: string;
    center?: Center;
    school_class?: SchoolClass;
    schoolClass?: SchoolClass;
    subject?: Subject;
    questions?: ExamQuestionData[];
    questions_count?: number;
    exam_results_count?: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

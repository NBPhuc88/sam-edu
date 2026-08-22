export type ExamSkill = 'listening' | 'reading' | 'writing' | 'speaking';

export type QuestionType =
    | 'single_choice'
    | 'multiple_choice'
    | 'true_false_not_given'
    | 'fill_in_blank'
    | 'drag_drop_cloze'
    | 'matching'
    | 'matching_image'
    | 'matching_sentences'
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
    skills: ExamSkill[];
}

export interface ExamSkillMeta {
    skill: ExamSkill;
    label: string;
    englishLabel: string;
    iconName: string;
    color: string;
    badgeColor: string;
    description: string;
    supportedQuestionTypes: QuestionType[];
}

export const EXAM_SKILLS: ExamSkillMeta[] = [
    {
        skill: 'listening',
        label: 'Kỹ Năng Nghe',
        englishLabel: 'Listening',
        iconName: 'Headphones',
        color: 'blue',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Bài thi Nghe hiểu qua file Audio MP3, bao gồm trắc nghiệm bài nghe, điền từ vào chỗ trống, kéo thả từ, gán nhãn sơ đồ, ghép câu với hình',
        supportedQuestionTypes: [
            'single_choice',
            'multiple_choice',
            'true_false_not_given',
            'fill_in_blank',
            'drag_drop_cloze',
            'matching',
            'matching_image',
            'diagram_labelling',
        ],
    },
    {
        skill: 'reading',
        label: 'Kỹ Năng Đọc',
        englishLabel: 'Reading',
        iconName: 'BookOpen',
        color: 'emerald',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Đọc hiểu đoạn văn bản, trắc nghiệm đọc, True/False/Not Given, nối tiêu đề, kéo thả từ vào chỗ trống, ghép câu với hình, ghép vế câu, tìm lỗi sai',
        supportedQuestionTypes: [
            'single_choice',
            'multiple_choice',
            'true_false_not_given',
            'drag_drop_cloze',
            'matching',
            'matching_image',
            'matching_sentences',
            'fill_in_blank',
            'ordering',
            'find_mistake',
        ],
    },
    {
        skill: 'writing',
        label: 'Kỹ Năng Viết',
        englishLabel: 'Writing',
        iconName: 'PenTool',
        color: 'amber',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Tự luận viết bài văn dài, sắp xếp từ xáo trộn thành câu hoàn chỉnh, ghép câu, kéo thả từ, điền từ hoặc viết lại câu',
        supportedQuestionTypes: [
            'essay',
            'ordering',
            'drag_drop_cloze',
            'matching_sentences',
            'fill_in_blank',
            'find_mistake',
        ],
    },
    {
        skill: 'speaking',
        label: 'Kỹ Năng Nói',
        englishLabel: 'Speaking',
        iconName: 'Mic',
        color: 'pink',
        badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
        description: 'Ghi âm trực tiếp câu trả lời qua micro trình duyệt, trả lời các chủ đề khẩu ngữ IELTS / HSKK',
        supportedQuestionTypes: [
            'audio_record',
        ],
    },
];

export const QUESTION_TYPES: QuestionTypeMeta[] = [
    {
        type: 'single_choice',
        label: 'Trắc nghiệm 1 đáp án',
        description: 'Chọn 1 đáp án đúng duy nhất trong danh sách lựa chọn A, B, C, D',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        iconName: 'CheckCircle2',
        autoGraded: true,
        skills: ['listening', 'reading'],
    },
    {
        type: 'multiple_choice',
        label: 'Trắc nghiệm nhiều đáp án',
        description: 'Chọn từ 2 hoặc nhiều đáp án đúng (Pick 2 out of 5...)',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        iconName: 'ListChecks',
        autoGraded: true,
        skills: ['listening', 'reading'],
    },
    {
        type: 'true_false_not_given',
        label: 'Đúng / Sai / Không đề cập',
        description: 'Dạng IELTS True/False/Not Given, Yes/No/Not Given, HSK Đúng/Sai',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconName: 'HelpCircle',
        autoGraded: true,
        skills: ['listening', 'reading'],
    },
    {
        type: 'fill_in_blank',
        label: 'Điền vào chỗ trống',
        description: 'Điền từ vào các vị trí [blank_1], [blank_2] trong đoạn văn',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        iconName: 'FileText',
        autoGraded: true,
        skills: ['listening', 'reading', 'writing'],
    },
    {
        type: 'drag_drop_cloze',
        label: 'Kéo - Thả từ vào chỗ trống',
        description: 'Kéo thả các từ khóa từ kho từ cho sẵn vào các vị trí [blank_1], [blank_2] trong đoạn văn',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconName: 'Move',
        autoGraded: true,
        skills: ['listening', 'reading', 'writing'],
    },
    {
        type: 'matching',
        label: 'Nối cặp / Ghép tiêu đề',
        description: 'Ghép nối thông tin giữa 2 cột (Ghép tiêu đề đoạn văn, nối từ vựng)',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        iconName: 'GitMerge',
        autoGraded: true,
        skills: ['listening', 'reading'],
    },
    {
        type: 'matching_image',
        label: 'Ghép câu với hình ảnh',
        description: 'Ghép các câu mô tả (A, B, C...) tương ứng với các bức hình minh họa (1, 2, 3...)',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        iconName: 'ImageIcon',
        autoGraded: true,
        skills: ['reading', 'listening'],
    },
    {
        type: 'matching_sentences',
        label: 'Ghép câu với nhau / Ghép vế câu',
        description: 'Ghép nửa đầu của câu (1, 2, 3...) với nửa sau phù hợp (A, B, C...) để tạo câu hoàn chỉnh',
        badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
        iconName: 'GitMerge',
        autoGraded: true,
        skills: ['reading', 'writing'],
    },
    {
        type: 'ordering',
        label: 'Sắp xếp thứ tự / Ghép câu',
        description: 'Sắp xếp các cụm từ xáo trộn thành câu hoàn chỉnh hoặc sắp xếp đoạn',
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        iconName: 'ArrowUpDown',
        autoGraded: true,
        skills: ['reading', 'writing'],
    },
    {
        type: 'diagram_labelling',
        label: 'Gán nhãn sơ đồ / Bản đồ',
        description: 'Gán các địa danh / bộ phận vào các vị trí ghim A, B, C... trên sơ đồ',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        iconName: 'MapPin',
        autoGraded: true,
        skills: ['listening'],
    },
    {
        type: 'find_mistake',
        label: 'Tìm lỗi sai trong câu',
        description: 'Chọn 1 trong các phần gạch chân A, B, C, D bị sai ngữ pháp',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        iconName: 'AlertTriangle',
        autoGraded: true,
        skills: ['reading', 'writing'],
    },
    {
        type: 'essay',
        label: 'Tự luận / Viết bài văn',
        description: 'Học sinh viết đoạn văn / bài văn dài, giáo viên chấm theo Rubrics',
        badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
        iconName: 'PenTool',
        autoGraded: false,
        skills: ['writing'],
    },
    {
        type: 'audio_record',
        label: 'Ghi âm trả lời / Speaking',
        description: 'Học sinh thu âm câu trả lời trực tiếp từ micro trình duyệt',
        badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
        iconName: 'Mic',
        autoGraded: false,
        skills: ['speaking'],
    },
];

export interface ExamQuestionData {
    id?: number;
    section_id?: number;
    code?: string;
    title?: string | null;
    skill?: ExamSkill;
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

export interface ExamSectionData {
    id?: number;
    tempId?: string;
    title: string;
    description?: string | null;
    skill: ExamSkill;
    order_index?: number;
    questions: ExamQuestionData[];
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
    center?: Center;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

export interface ExamTypeRelation {
    id: number;
    name: string;
    code: string;
    description?: string | null;
}

export interface Exam {
    id: number;
    center_id: number;
    class_id: number | null;
    subject_id: number | null;
    code: string;
    name: string;
    exam_type_id?: number | null;
    exam_type?: string | ExamTypeRelation;
    examType?: ExamTypeRelation;
    duration_minutes: number | null;
    max_score: number | string;
    pass_score: number | string | null;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    max_attempts: number;
    is_practice?: boolean;
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
    sections?: ExamSectionData[];
    questions?: ExamQuestionData[];
    sections_count?: number;
    questions_count?: number;
    exam_results_count?: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

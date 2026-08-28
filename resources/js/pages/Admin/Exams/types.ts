import {
    SKILL_LISTENING,
    SKILL_READING,
    SKILL_WRITING,
    SKILL_SPEAKING,
    QUESTION_TYPE_SINGLE_CHOICE,
    QUESTION_TYPE_MULTIPLE_CHOICE,
    QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN,
    QUESTION_TYPE_FILL_IN_BLANK,
    QUESTION_TYPE_DRAG_DROP_CLOZE,
    QUESTION_TYPE_MATCHING,
    QUESTION_TYPE_MATCHING_IMAGE,
    QUESTION_TYPE_MATCHING_SENTENCES,
    QUESTION_TYPE_ORDERING,
    QUESTION_TYPE_DIAGRAM_LABELLING,
    QUESTION_TYPE_FIND_MISTAKE,
    QUESTION_TYPE_ESSAY,
    QUESTION_TYPE_AUDIO_RECORD,
    EXAM_STATUS_DRAFT,
    EXAM_STATUS_PUBLISHED,
    EXAM_STATUS_COMPLETED,
    EXAM_STATUS_CANCELLED,
} from '@/constants/enums';

export type ExamSkill = number;
export type QuestionType = number;

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
        skill: SKILL_LISTENING,
        label: 'Kỹ Năng Nghe',
        englishLabel: 'Listening',
        iconName: 'Headphones',
        color: 'blue',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Bài thi Nghe hiểu qua file Audio MP3, bao gồm trắc nghiệm bài nghe, điền từ vào chỗ trống, kéo thả từ, gán nhãn sơ đồ, ghép câu với hình',
        supportedQuestionTypes: [
            QUESTION_TYPE_SINGLE_CHOICE,
            QUESTION_TYPE_MULTIPLE_CHOICE,
            QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN,
            QUESTION_TYPE_FILL_IN_BLANK,
            QUESTION_TYPE_DRAG_DROP_CLOZE,
            QUESTION_TYPE_MATCHING,
            QUESTION_TYPE_MATCHING_IMAGE,
            QUESTION_TYPE_DIAGRAM_LABELLING,
        ],
    },
    {
        skill: SKILL_READING,
        label: 'Kỹ Năng Đọc',
        englishLabel: 'Reading',
        iconName: 'BookOpen',
        color: 'emerald',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Đọc hiểu đoạn văn bản, trắc nghiệm đọc, True/False/Not Given, nối tiêu đề, kéo thả từ vào chỗ trống, ghép câu với hình, ghép vế câu, tìm lỗi sai',
        supportedQuestionTypes: [
            QUESTION_TYPE_SINGLE_CHOICE,
            QUESTION_TYPE_MULTIPLE_CHOICE,
            QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN,
            QUESTION_TYPE_DRAG_DROP_CLOZE,
            QUESTION_TYPE_MATCHING,
            QUESTION_TYPE_MATCHING_IMAGE,
            QUESTION_TYPE_MATCHING_SENTENCES,
            QUESTION_TYPE_FILL_IN_BLANK,
            QUESTION_TYPE_ORDERING,
            QUESTION_TYPE_FIND_MISTAKE,
        ],
    },
    {
        skill: SKILL_WRITING,
        label: 'Kỹ Năng Viết',
        englishLabel: 'Writing',
        iconName: 'PenTool',
        color: 'amber',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Tự luận viết bài văn dài, sắp xếp từ xáo trộn thành câu hoàn chỉnh, ghép câu, kéo thả từ, điền từ hoặc viết lại câu',
        supportedQuestionTypes: [
            QUESTION_TYPE_ESSAY,
            QUESTION_TYPE_ORDERING,
            QUESTION_TYPE_DRAG_DROP_CLOZE,
            QUESTION_TYPE_MATCHING_SENTENCES,
            QUESTION_TYPE_FILL_IN_BLANK,
            QUESTION_TYPE_FIND_MISTAKE,
        ],
    },
    {
        skill: SKILL_SPEAKING,
        label: 'Kỹ Năng Nói',
        englishLabel: 'Speaking',
        iconName: 'Mic',
        color: 'pink',
        badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
        description: 'Ghi âm trực tiếp câu trả lời qua micro trình duyệt, trả lời các chủ đề khẩu ngữ IELTS / HSKK',
        supportedQuestionTypes: [
            QUESTION_TYPE_AUDIO_RECORD,
        ],
    },
];

export const QUESTION_TYPES: QuestionTypeMeta[] = [
    {
        type: QUESTION_TYPE_SINGLE_CHOICE,
        label: 'Trắc nghiệm 1 đáp án',
        description: 'Chọn 1 đáp án đúng duy nhất trong danh sách lựa chọn A, B, C, D',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        iconName: 'CheckCircle2',
        autoGraded: true,
        skills: [SKILL_LISTENING, SKILL_READING],
    },
    {
        type: QUESTION_TYPE_MULTIPLE_CHOICE,
        label: 'Trắc nghiệm nhiều đáp án',
        description: 'Chọn từ 2 hoặc nhiều đáp án đúng (Pick 2 out of 5...)',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        iconName: 'ListChecks',
        autoGraded: true,
        skills: [SKILL_LISTENING, SKILL_READING],
    },
    {
        type: QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN,
        label: 'Đúng / Sai / Không đề cập',
        description: 'Dạng IELTS True/False/Not Given, Yes/No/Not Given, HSK Đúng/Sai',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconName: 'HelpCircle',
        autoGraded: true,
        skills: [SKILL_LISTENING, SKILL_READING],
    },
    {
        type: QUESTION_TYPE_FILL_IN_BLANK,
        label: 'Điền vào chỗ trống',
        description: 'Điền từ vào các vị trí [blank_1], [blank_2] trong đoạn văn',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        iconName: 'FileText',
        autoGraded: true,
        skills: [SKILL_LISTENING, SKILL_READING, SKILL_WRITING],
    },
    {
        type: QUESTION_TYPE_DRAG_DROP_CLOZE,
        label: 'Kéo - Thả từ vào chỗ trống',
        description: 'Kéo thả các từ khóa từ kho từ cho sẵn vào các vị trí [blank_1], [blank_2] trong đoạn văn',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconName: 'Move',
        autoGraded: true,
        skills: [SKILL_LISTENING, SKILL_READING, SKILL_WRITING],
    },
    {
        type: QUESTION_TYPE_MATCHING,
        label: 'Nối cặp / Ghép tiêu đề',
        description: 'Ghép nối thông tin giữa 2 cột (Ghép tiêu đề đoạn văn, nối từ vựng)',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        iconName: 'GitMerge',
        autoGraded: true,
        skills: [SKILL_LISTENING, SKILL_READING],
    },
    {
        type: QUESTION_TYPE_MATCHING_IMAGE,
        label: 'Ghép câu với hình ảnh',
        description: 'Ghép các câu mô tả (A, B, C...) tương ứng với các bức hình minh họa (1, 2, 3...)',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        iconName: 'ImageIcon',
        autoGraded: true,
        skills: [SKILL_READING, SKILL_LISTENING],
    },
    {
        type: QUESTION_TYPE_MATCHING_SENTENCES,
        label: 'Ghép câu với nhau / Ghép vế câu',
        description: 'Ghép nửa đầu của câu (1, 2, 3...) với nửa sau phù hợp (A, B, C...) để tạo câu hoàn chỉnh',
        badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
        iconName: 'GitMerge',
        autoGraded: true,
        skills: [SKILL_READING, SKILL_WRITING],
    },
    {
        type: QUESTION_TYPE_ORDERING,
        label: 'Sắp xếp thứ tự / Ghép câu',
        description: 'Sắp xếp các cụm từ xáo trộn thành câu hoàn chỉnh hoặc sắp xếp đoạn',
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        iconName: 'ArrowUpDown',
        autoGraded: true,
        skills: [SKILL_READING, SKILL_WRITING],
    },
    {
        type: QUESTION_TYPE_DIAGRAM_LABELLING,
        label: 'Gán nhãn sơ đồ / Bản đồ',
        description: 'Gán các địa danh / bộ phận vào các vị trí ghim A, B, C... trên sơ đồ',
        badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
        iconName: 'MapPin',
        autoGraded: true,
        skills: [SKILL_LISTENING],
    },
    {
        type: QUESTION_TYPE_FIND_MISTAKE,
        label: 'Tìm lỗi sai trong câu',
        description: 'Chọn 1 trong các phần gạch chân A, B, C, D bị sai ngữ pháp',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        iconName: 'AlertTriangle',
        autoGraded: true,
        skills: [SKILL_READING, SKILL_WRITING],
    },
    {
        type: QUESTION_TYPE_ESSAY,
        label: 'Tự luận / Viết bài văn',
        description: 'Học sinh viết đoạn văn / bài văn dài, giáo viên chấm theo Rubrics',
        badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
        iconName: 'PenTool',
        autoGraded: false,
        skills: [SKILL_WRITING],
    },
    {
        type: QUESTION_TYPE_AUDIO_RECORD,
        label: 'Ghi âm trả lời / Speaking',
        description: 'Học sinh thu âm câu trả lời trực tiếp từ micro trình duyệt',
        badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
        iconName: 'Mic',
        autoGraded: false,
        skills: [SKILL_SPEAKING],
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
    score: number;
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

export interface Exam {
    id: number;
    center_id: number;
    class_id: number | null;
    subject_id: number | null;
    code: string;
    name: string;
    duration_minutes: number | null;
    max_score: number;
    pass_score: number | null;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    max_attempts: number;
    is_practice?: boolean;
    description: string | null;
    exam_date: string | null;
    start_time: string | null;
    end_time: string | null;
    status: number;
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

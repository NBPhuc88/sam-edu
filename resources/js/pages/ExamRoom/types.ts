export type SkillType = 'reading' | 'listening' | 'writing' | 'speaking';

export type QuestionType =
    | 'single_choice'
    | 'multiple_choice'
    | 'true_false_not_given'
    | 'fill_in_blank'
    | 'matching'
    | 'matching_sentences'
    | 'matching_image'
    | 'ordering'
    | 'diagram_labelling'
    | 'find_mistake'
    | 'essay'
    | 'audio_record';

export interface ExamQuestionData {
    id?: number;
    section_id?: number | null;
    code?: string;
    title?: string | null;
    question_type: QuestionType;
    skill: SkillType;
    content: string;
    score: number;
    order_index: number;
    options: any;
    correct_answer: any;
    explanation?: string | null;
    audio_url?: string | null;
    image_url?: string | null;
}

export interface ExamSectionData {
    id?: number;
    exam_id?: number;
    title: string;
    description?: string | null;
    skill: SkillType;
    order_index: number;
    questions: ExamQuestionData[];
}

export interface Subject {
    id: number;
    name: string;
    code: string;
}

export interface SchoolClass {
    id: number;
    name: string;
    code: string;
    center_id: number;
    center?: {
        id: number;
        name: string;
    };
    students?: Student[];
}

export interface Student {
    id: number;
    full_name: string;
    student_code?: string;
    username?: string;
}

export interface Exam {
    id: number;
    name: string;
    code: string;
    exam_type: string;
    duration_minutes: number;
    max_score: number;
    pass_score?: number | null;
    subject?: Subject;
    sections: ExamSectionData[];
}

export interface ClassExam {
    id: number;
    code?: string;
    access_code?: string;
    class_id: number;
    exam_id: number;
    title: string;
    exam_date: string;
    start_time?: string | null;
    end_time?: string | null;
    valid_from?: string | null;
    valid_to?: string | null;
    duration_minutes?: number | null;
    max_score: number;
    pass_score?: number | null;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    schoolClass?: SchoolClass;
    school_class?: SchoolClass;
    exam?: Exam;
}

export interface ClassExamSubmission {
    id: number;
    class_exam_id: number;
    student_id: number;
    attempt_number: number;
    started_at?: string | null;
    submitted_at?: string | null;
    duration_seconds_used: number;
    score?: number | null;
    total_correct: number;
    total_questions: number;
    status: 'in_progress' | 'submitted' | 'timeout_submitted' | 'missed';
    is_graded?: boolean;
    requires_manual_grading?: boolean;
    graded_at?: string | null;
    teacher_feedback?: string | null;
    answers?: Record<number | string, any>;
    grading_details?: Record<number | string, any>;
    student?: Student;
}

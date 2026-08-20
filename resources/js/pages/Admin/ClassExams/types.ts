import { Center, Exam, PaginatedData, SchoolClass, Subject } from '../Exams/types';

export interface ClassExam {
    id: number;
    code?: string | null;
    access_code?: string | null;
    class_id: number;
    exam_id: number;
    title: string;
    exam_date: string;
    start_time?: string | null;
    end_time?: string | null;
    duration_minutes?: number | null;
    max_score: number;
    pass_score?: number | null;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    created_by_teacher_id?: number | null;
    created_by_admin_id?: number | null;
    created_at?: string;
    updated_at?: string;

    // Relations
    school_class?: SchoolClass;
    schoolClass?: SchoolClass;
    exam?: Exam;
    created_by_teacher?: any;
    created_by_admin?: any;
    results_count?: number;
}

export interface ClassExamFormData {
    id?: number;
    class_id: number | string;
    exam_id: number | string;
    title: string;
    exam_date: string;
    start_time?: string;
    end_time?: string;
    duration_minutes?: number | string;
    max_score?: number | string;
    pass_score?: number | string;
    status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export type { Center, Exam, PaginatedData, SchoolClass, Subject };

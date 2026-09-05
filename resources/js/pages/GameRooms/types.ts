export type Answer = string | string[] | Record<string, string> | null;
export interface Ranking {
    id: number;
    name: string;
    total_score: number;
    streak_count: number;
    rank: number;
}
export interface GameQuestion {
    id: number;
    title: string | null;
    content: string;
    question_type: number;
    options: unknown;
    image_url: string | null;
    audio_url: string | null;
    section_description: string | null;
}
export interface RoomState {
    id: number;
    name: string;
    code: string;
    pin: string;
    status: number;
    question_index: number;
    question_count: number;
    question_time_limit: number;
    question: GameQuestion | null;
    question_started_at: string | null;
    expires_at: string | null;
    server_time: string;
    is_host: boolean;
    is_student: boolean;
    leaderboard: Ranking[];
    participant_count: number;
    answer_count: number;
    my_answer: {
        answer: Answer;
        response_seconds: number;
        points: number;
        is_correct: boolean;
    } | null;
}

import React from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';
import ChoiceReview from './reviews/ChoiceReview';
import FillInBlankReview from './reviews/FillInBlankReview';
import DragDropClozeReview from './reviews/DragDropClozeReview';
import MatchingReview from './reviews/MatchingReview';
import MatchingImageReview from './reviews/MatchingImageReview';
import DiagramLabellingReview from './reviews/DiagramLabellingReview';
import OrderingReview from './reviews/OrderingReview';
import FindMistakeReview from './reviews/FindMistakeReview';
import EssayAudioReview from './reviews/EssayAudioReview';

export interface QuestionReviewItem {
    id?: number;
    code?: string;
    title?: string | null;
    question_type: string;
    skill?: string;
    content: string;
    image_url?: string | null;
    audio_url?: string | null;
    options?: any;
    correct_answer?: any;
    user_answer?: any;
    is_correct?: boolean;
    explanation?: string | null;
    teacher_comment?: string | null;
}

interface Props {
    question: QuestionReviewItem;
}

export default function QuestionReviewDetail({ question }: Props) {
    const { question_type, explanation, teacher_comment } = question;

    const renderTypeSpecificReview = () => {
        switch (question_type) {
            case 'single_choice':
            case 'multiple_choice':
            case 'true_false_not_given':
                return <ChoiceReview question={question} />;

            case 'fill_in_blank':
                return <FillInBlankReview question={question} />;

            case 'drag_drop_cloze':
                return <DragDropClozeReview question={question} />;

            case 'matching':
            case 'matching_sentences':
                return <MatchingReview question={question} />;

            case 'matching_image':
                return <MatchingImageReview question={question} />;

            case 'diagram_labelling':
                return <DiagramLabellingReview question={question} />;

            case 'ordering':
                return <OrderingReview question={question} />;

            case 'find_mistake':
                return <FindMistakeReview question={question} />;

            case 'essay':
            case 'audio_record':
                return <EssayAudioReview question={question} />;

            default:
                return (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 text-xs text-gray-700">
                        {question.content}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-3.5">
            {/* Specific Question Review UI */}
            {renderTypeSpecificReview()}

            {/* Explanation / Solution Guide */}
            {explanation && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-950 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-800 text-2xs">
                        <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Lời giải thích chi tiết:</span>
                    </div>
                    <p className="font-medium whitespace-pre-wrap leading-relaxed">
                        {explanation}
                    </p>
                </div>
            )}

            {/* Teacher Comment */}
            {teacher_comment && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs text-indigo-950 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-indigo-800 text-2xs">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Nhận xét của giáo viên:</span>
                    </div>
                    <p className="font-medium whitespace-pre-wrap leading-relaxed">
                        {teacher_comment}
                    </p>
                </div>
            )}
        </div>
    );
}

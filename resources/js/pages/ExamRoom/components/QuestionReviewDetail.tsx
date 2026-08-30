import {
QUESTION_TYPE_AUDIO_RECORD,
QUESTION_TYPE_DIAGRAM_LABELLING,
QUESTION_TYPE_DRAG_DROP_CLOZE,
QUESTION_TYPE_ESSAY,
QUESTION_TYPE_FILL_IN_BLANK,
QUESTION_TYPE_FIND_MISTAKE,
QUESTION_TYPE_MATCHING,
QUESTION_TYPE_MATCHING_IMAGE,
QUESTION_TYPE_MATCHING_SENTENCES,
QUESTION_TYPE_MULTIPLE_CHOICE,
QUESTION_TYPE_ORDERING,
QUESTION_TYPE_SINGLE_CHOICE,
QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN,
} from '@/constants/enums';
import { HelpCircle,Sparkles } from 'lucide-react';
import ChoiceReview from './reviews/ChoiceReview';
import DiagramLabellingReview from './reviews/DiagramLabellingReview';
import DragDropClozeReview from './reviews/DragDropClozeReview';
import EssayAudioReview from './reviews/EssayAudioReview';
import FillInBlankReview from './reviews/FillInBlankReview';
import FindMistakeReview from './reviews/FindMistakeReview';
import MatchingImageReview from './reviews/MatchingImageReview';
import MatchingReview from './reviews/MatchingReview';
import OrderingReview from './reviews/OrderingReview';

export interface QuestionReviewItem {
    id?: number;
    code?: string;
    title?: string | null;
    question_type: number;
    skill?: number;
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
            case QUESTION_TYPE_SINGLE_CHOICE:
            case QUESTION_TYPE_MULTIPLE_CHOICE:
            case QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN:
                return <ChoiceReview question={question} />;

            case QUESTION_TYPE_FILL_IN_BLANK:
                return <FillInBlankReview question={question} />;

            case QUESTION_TYPE_DRAG_DROP_CLOZE:
                return <DragDropClozeReview question={question} />;

            case QUESTION_TYPE_MATCHING:
            case QUESTION_TYPE_MATCHING_SENTENCES:
                return <MatchingReview question={question} />;

            case QUESTION_TYPE_MATCHING_IMAGE:
                return <MatchingImageReview question={question} />;

            case QUESTION_TYPE_DIAGRAM_LABELLING:
                return <DiagramLabellingReview question={question} />;

            case QUESTION_TYPE_ORDERING:
                return <OrderingReview question={question} />;

            case QUESTION_TYPE_FIND_MISTAKE:
                return <FindMistakeReview question={question} />;

            case QUESTION_TYPE_ESSAY:
            case QUESTION_TYPE_AUDIO_RECORD:
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

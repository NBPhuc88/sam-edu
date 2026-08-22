import React from 'react';
import { Check, X } from 'lucide-react';
import { QuestionReviewItem } from '../QuestionReviewDetail';

interface Props {
    question: QuestionReviewItem;
}

export default function ChoiceReview({ question }: Props) {
    const { question_type, options, correct_answer, user_answer } = question;

    if (question_type === 'true_false_not_given') {
        const tfOptions = ['TRUE', 'FALSE', 'NOT GIVEN'];
        const correctVal = String(correct_answer ?? '').trim().toUpperCase();
        const userVal = user_answer !== null && user_answer !== undefined ? String(user_answer).trim().toUpperCase() : null;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {tfOptions.map((opt) => {
                    const isCorrectChoice = opt === correctVal;
                    const isUserChoice = opt === userVal;

                    let cardClass = 'border-gray-200 bg-white text-gray-700 opacity-60';
                    let badgeNode = null;

                    if (isCorrectChoice && isUserChoice) {
                        cardClass = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs';
                        badgeNode = (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                <Check className="h-3 w-3 stroke-[3]" /> Đáp án đúng (Bạn đã chọn)
                            </span>
                        );
                    } else if (isCorrectChoice) {
                        cardClass = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs';
                        badgeNode = (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                <Check className="h-3 w-3 stroke-[3]" /> Đáp án đúng
                            </span>
                        );
                    } else if (isUserChoice) {
                        cardClass = 'border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-xs';
                        badgeNode = (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                <X className="h-3 w-3 stroke-[3]" /> Bạn đã chọn (Sai)
                            </span>
                        );
                    }

                    return (
                        <div
                            key={opt}
                            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${cardClass}`}
                        >
                            <span className="text-sm font-bold tracking-wide">{opt}</span>
                            {badgeNode && <div className="mt-1.5">{badgeNode}</div>}
                        </div>
                    );
                })}
            </div>
        );
    }

    // Single / Multiple Choice
    const isMulti = question_type === 'multiple_choice';
    const optsList: Array<{ key: string; text: string }> = Array.isArray(options)
        ? options.map((opt: any, idx: number) => {
              if (typeof opt === 'string') {
                  const key = String.fromCharCode(65 + idx);
                  return { key, text: opt };
              }
              return {
                  key: String(opt.key ?? opt.id ?? String.fromCharCode(65 + idx)),
                  text: String(opt.text ?? opt.content ?? opt.label ?? ''),
              };
          })
        : [];

    const correctKeys: string[] = isMulti
        ? Array.isArray(correct_answer)
            ? correct_answer.map(String)
            : [String(correct_answer ?? '')]
        : [String(correct_answer ?? '')];

    const userKeys: string[] = isMulti
        ? Array.isArray(user_answer)
            ? user_answer.map(String)
            : user_answer !== null && user_answer !== undefined
            ? [String(user_answer)]
            : []
        : user_answer !== null && user_answer !== undefined
        ? [String(user_answer)]
        : [];

    return (
        <div className="space-y-2 pt-2">
            {optsList.map((opt) => {
                const isCorrectChoice = correctKeys.includes(opt.key);
                const isUserChoice = userKeys.includes(opt.key);

                let cardStyle = 'border-gray-200 bg-white text-gray-700 opacity-60';
                let badge = null;

                if (isCorrectChoice && isUserChoice) {
                    cardStyle = 'border-2 border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs';
                    badge = (
                        <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-lg">
                            <Check className="h-3.5 w-3.5 stroke-[3]" /> Đáp án đúng (Bạn đã chọn)
                        </span>
                    );
                } else if (isCorrectChoice) {
                    cardStyle = 'border-2 border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs';
                    badge = (
                        <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-lg">
                            <Check className="h-3.5 w-3.5 stroke-[3]" /> Đáp án đúng
                        </span>
                    );
                } else if (isUserChoice) {
                    cardStyle = 'border-2 border-rose-500 bg-rose-50/80 text-rose-950 font-bold shadow-xs';
                    badge = (
                        <span className="inline-flex items-center gap-1 text-2xs font-bold text-rose-700 bg-rose-100/90 px-2.5 py-1 rounded-lg">
                            <X className="h-3.5 w-3.5 stroke-[3]" /> Bạn đã chọn (Sai)
                        </span>
                    );
                }

                return (
                    <div
                        key={opt.key}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${cardStyle}`}
                    >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                            <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                    isCorrectChoice
                                        ? 'bg-emerald-600 text-white'
                                        : isUserChoice
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                }`}
                            >
                                {opt.key}
                            </span>
                            <span className="text-xs sm:text-sm">{opt.text}</span>
                        </div>
                        {badge && <div className="shrink-0">{badge}</div>}
                    </div>
                );
            })}
        </div>
    );
}

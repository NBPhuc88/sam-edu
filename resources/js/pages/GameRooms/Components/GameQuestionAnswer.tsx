import { useState } from 'react';
import QuestionRunnerRouter from '../../ExamRoom/components/QuestionRunnerRouter';
import { initialGameAnswer } from '../game-answer';
import type { Answer, GameQuestion } from '../types';
const types: Record<number, string> = {
    5: 'drag_drop_cloze',
    6: 'matching',
    7: 'matching_image',
    8: 'matching',
    9: 'ordering',
    10: 'diagram_labelling',
    11: 'find_mistake',
};
const colors = [
    'bg-rose-500',
    'bg-blue-500',
    'bg-amber-400 text-slate-950',
    'bg-emerald-500',
];
const icons = ['▲', '◆', '●', '■'];
export default function GameQuestionAnswer({
    question,
    disabled,
    onSubmit,
    savedAnswer,
}: {
    question: GameQuestion;
    disabled: boolean;
    savedAnswer?: Answer;
    onSubmit: (answer: Answer) => void;
}) {
    const [draft, setValue] = useState<Answer>(() =>
        initialGameAnswer(question),
    );
    const value = savedAnswer ?? draft;
    const choice = [1, 2, 3].includes(question.question_type);
    const rawOptions =
        Array.isArray(question.options) && question.options.length
            ? question.options
            : question.question_type === 3
              ? ['TRUE', 'FALSE', 'NOT_GIVEN']
              : [];
    const options = rawOptions.map((raw: unknown, i: number) => {
        const option =
            typeof raw === 'object' && raw !== null
                ? (raw as Record<string, unknown>)
                : {};

        return {
            key: String(
                option.key ??
                    option.id ??
                    option.value ??
                    (question.question_type === 3
                        ? raw
                        : String.fromCharCode(65 + i)),
            ),
            text: String(option.text ?? option.content ?? option.label ?? raw),
        };
    });
    const multi = question.question_type === 2;
    const select = (key: string) => {
        if (disabled) {
            return;
        }

        if (!multi) {
            setValue(key);

            return;
        }

        const selected = Array.isArray(value) ? value : [];
        setValue(
            selected.includes(key)
                ? selected.filter((v) => v !== key)
                : [...selected, key],
        );
    };

    const isAnswerEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && !value.length) ||
        (typeof value === 'object' &&
            !Array.isArray(value) &&
            Object.keys(value as Record<string, unknown>).length === 0);

    return (
        <div>
            {choice ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    {options.map((option, i) => {
                        const isSelected = multi
                            ? Array.isArray(value) && value.includes(option.key)
                            : value === option.key;

                        return (
                            <button
                                key={option.key}
                                type="button"
                                disabled={disabled}
                                aria-pressed={isSelected}
                                onClick={() => select(option.key)}
                                className={`${colors[i % 4]} flex min-h-28 items-center justify-between gap-4 rounded-2xl p-5 text-left font-bold shadow-lg transition-all active:scale-95 disabled:opacity-60 aria-pressed:ring-4 aria-pressed:ring-white aria-pressed:scale-[1.02]`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl" aria-hidden="true">
                                        {icons[i % 4]}
                                    </span>
                                    <span>
                                        {String.fromCharCode(65 + i)}. {option.text}
                                    </span>
                                </div>
                                {isSelected && (
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/30 text-lg font-black text-white">
                                        ✓
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <fieldset
                    disabled={disabled}
                    className={`rounded-2xl bg-white p-5 text-slate-900 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
                >
                    <QuestionRunnerRouter
                        question={{
                            ...question,
                            question_type: types[question.question_type],
                        }}
                        value={value}
                        onChange={(next) => {
                            if (!disabled) {
                                setValue(next);
                            }
                        }}
                        disabled={disabled}
                    />
                </fieldset>
            )}
            <button
                type="button"
                disabled={disabled || isAnswerEmpty}
                onClick={() => {
                    if (!disabled && !isAnswerEmpty) {
                        onSubmit(value);
                    }
                }}
                className="arena-button mt-5 w-full text-base sm:text-lg font-black tracking-wide transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {savedAnswer ? 'Đã chọn đáp án ✓' : 'Chọn đáp án ⚡'}
            </button>
        </div>
    );
}

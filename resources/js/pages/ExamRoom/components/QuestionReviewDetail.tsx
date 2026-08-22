import React, { useMemo } from 'react';
import { Check, X, HelpCircle, Volume2, ArrowRight, CornerDownRight } from 'lucide-react';

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
    const {
        question_type,
        content = '',
        image_url,
        audio_url,
        options,
        correct_answer,
        user_answer,
    } = question;

    // Helper: Normalize options for single/multiple choice
    const choicesList = useMemo(() => {
        if (!options) return [];
        if (Array.isArray(options)) {
            return options.map((opt: any, idx: number) => ({
                id: String(opt.id ?? opt.key ?? String.fromCharCode(65 + idx)),
                text: String(opt.text ?? opt.content ?? opt.label ?? (typeof opt === 'string' ? opt : '')),
            }));
        }
        return [];
    }, [options]);

    // -----------------------------------------------------------------
    // 1. Render Single Choice Review
    // -----------------------------------------------------------------
    if (question_type === 'single_choice') {
        const correctId = String(correct_answer ?? '');
        const userChoiceId = user_answer !== null && user_answer !== undefined ? String(user_answer) : null;

        return (
            <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-1 gap-2.5">
                    {choicesList.map((opt) => {
                        const isCorrectOption = opt.id === correctId;
                        const isUserChoice = opt.id === userChoiceId;

                        let styleClasses = 'border-gray-200 bg-white text-gray-700 opacity-60';
                        let badge = null;

                        if (isCorrectOption && isUserChoice) {
                            // User chose the correct answer
                            styleClasses = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs';
                            badge = (
                                <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">
                                    <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                                    Đáp án đúng (Bạn đã chọn)
                                </span>
                            );
                        } else if (isCorrectOption) {
                            // Correct answer, user did not choose it
                            styleClasses = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs';
                            badge = (
                                <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">
                                    <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                                    Đáp án đúng
                                </span>
                            );
                        } else if (isUserChoice) {
                            // User chose this wrong option
                            styleClasses = 'border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-xs';
                            badge = (
                                <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-rose-800 bg-rose-100/90 px-2.5 py-1 rounded-lg border border-rose-300">
                                    <X className="h-3.5 w-3.5 text-rose-700 stroke-[3]" />
                                    Bạn đã chọn (Sai)
                                </span>
                            );
                        }

                        return (
                            <div
                                key={opt.id}
                                className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all text-xs sm:text-sm ${styleClasses}`}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <span
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                                            isCorrectOption
                                                ? 'bg-emerald-600 text-white'
                                                : isUserChoice
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {opt.id}
                                    </span>
                                    <span className="leading-snug">{opt.text}</span>
                                </div>
                                {badge && <div className="shrink-0">{badge}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 2. Render Multiple Choice Review
    // -----------------------------------------------------------------
    if (question_type === 'multiple_choice') {
        const correctIds = Array.isArray(correct_answer)
            ? correct_answer.map(String)
            : typeof correct_answer === 'string'
            ? [correct_answer]
            : [];
        const userChoiceIds = Array.isArray(user_answer)
            ? user_answer.map(String)
            : user_answer
            ? [String(user_answer)]
            : [];

        return (
            <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-1 gap-2.5">
                    {choicesList.map((opt) => {
                        const isCorrectOption = correctIds.includes(opt.id);
                        const isUserChoice = userChoiceIds.includes(opt.id);

                        let styleClasses = 'border-gray-200 bg-white text-gray-700 opacity-60';
                        let badge = null;

                        if (isCorrectOption && isUserChoice) {
                            styleClasses = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs';
                            badge = (
                                <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">
                                    <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                                    Đáp án đúng (Bạn đã chọn)
                                </span>
                            );
                        } else if (isCorrectOption) {
                            styleClasses = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs';
                            badge = (
                                <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">
                                    <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                                    Đáp án đúng
                                </span>
                            );
                        } else if (isUserChoice) {
                            styleClasses = 'border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-xs';
                            badge = (
                                <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-rose-800 bg-rose-100/90 px-2.5 py-1 rounded-lg border border-rose-300">
                                    <X className="h-3.5 w-3.5 text-rose-700 stroke-[3]" />
                                    Bạn đã chọn (Sai)
                                </span>
                            );
                        }

                        return (
                            <div
                                key={opt.id}
                                className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all text-xs sm:text-sm ${styleClasses}`}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <span
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                                            isCorrectOption
                                                ? 'bg-emerald-600 text-white'
                                                : isUserChoice
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {opt.id}
                                    </span>
                                    <span className="leading-snug">{opt.text}</span>
                                </div>
                                {badge && <div className="shrink-0">{badge}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 3. Render True / False / Not Given Review
    // -----------------------------------------------------------------
    if (question_type === 'true_false_not_given' || question_type === 'true_false') {
        const tfOptions = ['TRUE', 'FALSE', 'NOT GIVEN'];
        const correctVal = String(correct_answer ?? '').toUpperCase();
        const userVal = user_answer !== null && user_answer !== undefined ? String(user_answer).toUpperCase() : null;

        return (
            <div className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {tfOptions.map((tf) => {
                        const isCorrectOption = tf === correctVal;
                        const isUserChoice = tf === userVal;

                        let styleClasses = 'border-gray-200 bg-white text-gray-600 opacity-60';
                        let badge = null;

                        if (isCorrectOption && isUserChoice) {
                            styleClasses = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs';
                            badge = (
                                <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md mt-1">
                                    <Check className="h-3 w-3 stroke-[3]" /> Đúng (Bạn chọn)
                                </span>
                            );
                        } else if (isCorrectOption) {
                            styleClasses = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs';
                            badge = (
                                <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md mt-1">
                                    <Check className="h-3 w-3 stroke-[3]" /> Đáp án đúng
                                </span>
                            );
                        } else if (isUserChoice) {
                            styleClasses = 'border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-xs';
                            badge = (
                                <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md mt-1">
                                    <X className="h-3 w-3 stroke-[3]" /> Bạn chọn sai
                                </span>
                            );
                        }

                        return (
                            <div
                                key={tf}
                                className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${styleClasses}`}
                            >
                                <span className="text-xs sm:text-sm font-black tracking-wider">{tf}</span>
                                {badge}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 4. Render Fill In The Blank Review
    // -----------------------------------------------------------------
    if (question_type === 'fill_in_blank') {
        const userAnsObj = typeof user_answer === 'object' && user_answer ? user_answer : {};
        const correctAnsObj = typeof correct_answer === 'object' && correct_answer ? correct_answer : {};

        // Parse blanks [blank_X] in content
        const parts = (content || '').split(/(\[blank_\d+\])/g);
        let blankCount = 0;

        return (
            <div className="space-y-4 pt-2">
                <div className="rounded-2xl border border-gray-200 bg-slate-50/60 p-4 sm:p-5 text-xs sm:text-sm leading-loose sm:leading-loose text-gray-900 font-medium">
                    {parts.map((part, idx) => {
                        const match = part.match(/^\[(blank_\d+)\]$/);
                        if (match) {
                            blankCount++;
                            const bKey = match[1];
                            const uVal = String(userAnsObj[bKey] ?? userAnsObj[blankCount - 1] ?? '').trim();

                            // Determine correct value text
                            const cData = correctAnsObj[bKey] ?? correctAnsObj[blankCount - 1];
                            let cValText = '';
                            if (typeof cData === 'object' && cData?.accepted_answers) {
                                cValText = Array.isArray(cData.accepted_answers)
                                    ? cData.accepted_answers.join(' / ')
                                    : String(cData.accepted_answers);
                            } else if (typeof cData === 'string') {
                                cValText = cData;
                            } else {
                                cValText = String(cData ?? '');
                            }

                            const isBlankCorrect =
                                uVal !== '' &&
                                cValText.toLowerCase().split(' / ').some((acc) => acc.trim().toLowerCase() === uVal.toLowerCase());

                            return (
                                <span key={idx} className="inline-flex flex-wrap items-center gap-1.5 mx-1 my-1 align-middle">
                                    {isBlankCorrect ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-2xs">
                                            <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-3xs text-white font-mono">
                                                {blankCount}
                                            </span>
                                            <span>{uVal}</span>
                                            <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                                        </span>
                                    ) : (
                                        <>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-950 font-bold shadow-2xs">
                                                <span className="flex h-4 w-4 items-center justify-center rounded bg-rose-600 text-3xs text-white font-mono">
                                                    {blankCount}
                                                </span>
                                                <span>{uVal || '(Trống)'}</span>
                                                <X className="h-3.5 w-3.5 text-rose-700 stroke-[3]" />
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-2xs">
                                                <Check className="h-3 w-3 text-emerald-700 stroke-[3]" /> Đúng: {cValText}
                                            </span>
                                        </>
                                    )}
                                </span>
                            );
                        }

                        return <span key={idx}>{part}</span>;
                    })}
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 5. Render Drag & Drop Cloze Review
    // -----------------------------------------------------------------
    if (question_type === 'drag_drop_cloze') {
        const wordsList: Array<{ id: string; text: string }> = Array.isArray(options?.words)
            ? options.words
            : Array.isArray(options)
            ? options
            : [];
        const userAnsObj = typeof user_answer === 'object' && user_answer ? user_answer : {};
        const correctAnsObj = typeof correct_answer === 'object' && correct_answer ? correct_answer : {};

        const parts = (content || '').split(/(\[blank_\d+\])/g);
        let blankCount = 0;

        return (
            <div className="space-y-4 pt-2">
                <div className="rounded-3xl border border-gray-200 bg-slate-50/70 p-5 sm:p-6 text-xs sm:text-sm leading-loose sm:leading-loose text-gray-900 font-medium shadow-xs">
                    {parts.map((part, idx) => {
                        const match = part.match(/^\[(blank_\d+)\]$/);
                        if (match) {
                            blankCount++;
                            const bKey = match[1];
                            const userWordId = userAnsObj[bKey];
                            const correctWordId = correctAnsObj[bKey];

                            const userWord = wordsList.find((w) => w.id === userWordId);
                            const correctWord = wordsList.find((w) => w.id === correctWordId);

                            const isBlankCorrect = userWordId && correctWordId && String(userWordId) === String(correctWordId);

                            return (
                                <span key={idx} className="inline-flex flex-wrap items-center gap-1.5 mx-1.5 my-1 align-middle">
                                    {isBlankCorrect ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-2xs">
                                            <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-3xs text-white font-mono">
                                                {blankCount}
                                            </span>
                                            <span>{userWord?.text || userWordId}</span>
                                            <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                                        </span>
                                    ) : (
                                        <>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-950 font-bold shadow-2xs">
                                                <span className="flex h-4 w-4 items-center justify-center rounded bg-rose-600 text-3xs text-white font-mono">
                                                    {blankCount}
                                                </span>
                                                <span>{userWord?.text || (userWordId ? `(${userWordId})` : '(Chưa điền)')}</span>
                                                <X className="h-3.5 w-3.5 text-rose-700 stroke-[3]" />
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-950 font-bold text-xs">
                                                <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" /> Đáp án: {correctWord?.text || correctWordId}
                                            </span>
                                        </>
                                    )}
                                </span>
                            );
                        }

                        return <span key={idx}>{part}</span>;
                    })}
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 6. Render Matching / Matching Sentences Review
    // -----------------------------------------------------------------
    if (question_type === 'matching' || question_type === 'matching_sentences') {
        const leftItems = Array.isArray(options?.left_items) ? options.left_items : [];
        const rightItems = Array.isArray(options?.right_items) ? options.right_items : [];

        const userMap = typeof user_answer === 'object' && user_answer ? user_answer : {};
        const correctMap = typeof correct_answer === 'object' && correct_answer ? correct_answer : {};

        return (
            <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 gap-2.5">
                    {leftItems.map((lItem: any) => {
                        const lId = String(lItem.id ?? '');
                        const lText = String(lItem.text ?? lItem.label ?? lItem.content ?? '');

                        const uRightId = userMap[lId];
                        const cRightId = correctMap[lId];

                        const uRightObj = rightItems.find((r: any) => String(r.id) === String(uRightId));
                        const cRightObj = rightItems.find((r: any) => String(r.id) === String(cRightId));

                        const isPairCorrect = uRightId && cRightId && String(uRightId) === String(cRightId);

                        return (
                            <div
                                key={lId}
                                className={`rounded-2xl border p-4 transition-all text-xs sm:text-sm space-y-2 ${
                                    isPairCorrect
                                        ? 'border-2 border-emerald-500 bg-emerald-50/60 shadow-xs'
                                        : 'border-2 border-rose-400 bg-rose-50/50 shadow-xs'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 font-bold text-gray-900 flex-1">
                                        <span className="px-2 py-0.5 rounded-lg bg-gray-200 text-gray-800 font-mono text-xs">
                                            {lId}
                                        </span>
                                        <span>{lText}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="h-4 w-4 text-gray-400 shrink-0 hidden sm:block" />
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold ${
                                                isPairCorrect
                                                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                                    : 'bg-rose-100 text-rose-950 border border-rose-300'
                                            }`}
                                        >
                                            {isPairCorrect ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                                            ) : (
                                                <X className="h-3.5 w-3.5 text-rose-700 stroke-[3]" />
                                            )}
                                            {uRightObj ? uRightObj.text || uRightObj.label : uRightId ? `(${uRightId})` : '(Chưa nối)'}
                                        </span>
                                    </div>
                                </div>

                                {!isPairCorrect && cRightObj && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/90 p-2.5 rounded-xl border border-emerald-300">
                                        <CornerDownRight className="h-4 w-4 text-emerald-700 shrink-0" />
                                        <span>Đáp án đúng chuẩn: {cRightObj.text || cRightObj.label || cRightId}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 7. Render Matching Image Review
    // -----------------------------------------------------------------
    if (question_type === 'matching_image') {
        const sentences = Array.isArray(options?.sentences) ? options.sentences : [];
        const images = Array.isArray(options?.images) ? options.images : [];

        const userMap = typeof user_answer === 'object' && user_answer ? user_answer : {};
        const correctMap = typeof correct_answer === 'object' && correct_answer ? correct_answer : {};

        return (
            <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 gap-3">
                    {sentences.map((sent: any) => {
                        const sId = String(sent.id ?? '');
                        const sText = String(sent.text ?? sent.content ?? '');

                        const uImgId = userMap[sId];
                        const cImgId = correctMap[sId];

                        const uImgObj = images.find((im: any) => String(im.id) === String(uImgId));
                        const cImgObj = images.find((im: any) => String(im.id) === String(cImgId));

                        const isPairCorrect = uImgId && cImgId && String(uImgId) === String(cImgId);

                        return (
                            <div
                                key={sId}
                                className={`rounded-2xl border p-4 text-xs sm:text-sm space-y-3 ${
                                    isPairCorrect
                                        ? 'border-2 border-emerald-500 bg-emerald-50/60 shadow-xs'
                                        : 'border-2 border-rose-400 bg-rose-50/50 shadow-xs'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 font-bold text-gray-900 flex-1">
                                        <span className="px-2 py-0.5 rounded-lg bg-gray-200 text-gray-800 font-mono text-xs">
                                            {sId}
                                        </span>
                                        <span>{sText}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold ${
                                                isPairCorrect
                                                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                                    : 'bg-rose-100 text-rose-950 border border-rose-300'
                                            }`}
                                        >
                                            {isPairCorrect ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                                            ) : (
                                                <X className="h-3.5 w-3.5 text-rose-700 stroke-[3]" />
                                            )}
                                            Bạn ghép: {uImgObj ? uImgObj.label || uImgId : uImgId ? `(${uImgId})` : '(Chưa ghép)'}
                                        </span>
                                    </div>
                                </div>

                                {!isPairCorrect && cImgObj && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-100/90 p-2.5 rounded-xl border border-emerald-300">
                                        <CornerDownRight className="h-4 w-4 text-emerald-700 shrink-0" />
                                        <span>Đáp án đúng chuẩn: {cImgObj.label || cImgId}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 8. Render Ordering Review
    // -----------------------------------------------------------------
    if (question_type === 'ordering') {
        const itemsList: Array<{ id: string; text: string }> = Array.isArray(options)
            ? options.map((it: any, idx: number) => ({
                  id: String(it.id ?? idx + 1),
                  text: String(it.text ?? it.content ?? (typeof it === 'string' ? it : '')),
              }))
            : [];

        const userOrderIds: string[] = Array.isArray(user_answer) ? user_answer.map(String) : [];
        const correctOrderIds: string[] = Array.isArray(correct_answer) ? correct_answer.map(String) : [];

        const isFullyCorrect =
            userOrderIds.length > 0 &&
            correctOrderIds.length > 0 &&
            JSON.stringify(userOrderIds) === JSON.stringify(correctOrderIds);

        return (
            <div className="space-y-3 pt-2">
                {/* User sequence */}
                <div
                    className={`rounded-2xl border p-4 space-y-2 ${
                        isFullyCorrect
                            ? 'border-2 border-emerald-500 bg-emerald-50/70'
                            : 'border-2 border-rose-400 bg-rose-50/50'
                    }`}
                >
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-gray-600 block">
                        Thứ tự bạn đã sắp xếp:
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {userOrderIds.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">(Chưa sắp xếp)</span>
                        ) : (
                            userOrderIds.map((id, idx) => {
                                const it = itemsList.find((item) => item.id === id);
                                const isPosCorrect = correctOrderIds[idx] === id;
                                return (
                                    <div
                                        key={idx}
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                                            isPosCorrect
                                                ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                                                : 'bg-rose-100 border-rose-300 text-rose-950'
                                        }`}
                                    >
                                        <span className="font-mono text-3xs bg-black/10 px-1.5 py-0.5 rounded">
                                            {idx + 1}
                                        </span>
                                        <span>{it ? it.text : id}</span>
                                        {isPosCorrect ? (
                                            <Check className="h-3 w-3 text-emerald-700 stroke-[3]" />
                                        ) : (
                                            <X className="h-3 w-3 text-rose-700 stroke-[3]" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Correct Sequence */}
                {!isFullyCorrect && correctOrderIds.length > 0 && (
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 space-y-2">
                        <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-900 block">
                            Thứ tự chuẩn chính xác của đề:
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {correctOrderIds.map((id, idx) => {
                                const it = itemsList.find((item) => item.id === id);
                                return (
                                    <div
                                        key={idx}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-emerald-400 text-emerald-950 font-bold text-xs shadow-2xs"
                                    >
                                        <span className="font-mono text-3xs bg-emerald-200 text-emerald-950 px-1.5 py-0.5 rounded">
                                            {idx + 1}
                                        </span>
                                        <span>{it ? it.text : id}</span>
                                        <Check className="h-3 w-3 text-emerald-700 stroke-[3]" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 9. Render Diagram Labelling Review
    // -----------------------------------------------------------------
    if (question_type === 'diagram_labelling') {
        const labelsList = Array.isArray(options?.labels) ? options.labels : [];
        const userMap = typeof user_answer === 'object' && user_answer ? user_answer : {};
        const correctMap = typeof correct_answer === 'object' && correct_answer ? correct_answer : {};

        return (
            <div className="space-y-3 pt-2">
                {image_url && (
                    <div className="rounded-2xl border border-gray-200 p-2 bg-slate-50 flex justify-center max-h-72 overflow-hidden">
                        <img src={image_url} alt="Sơ đồ / Bản đồ" className="max-h-64 object-contain rounded-xl" />
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {labelsList.map((loc: any) => {
                        const locId = String(loc.id ?? '');
                        const locText = String(loc.text ?? loc.label ?? '');

                        const uPin = userMap[locId];
                        const cPin = correctMap[locId];

                        const isCorrectLoc = uPin && cPin && String(uPin) === String(cPin);

                        return (
                            <div
                                key={locId}
                                className={`rounded-2xl border p-3.5 text-xs flex items-center justify-between gap-2 ${
                                    isCorrectLoc
                                        ? 'border-2 border-emerald-500 bg-emerald-50/70 font-bold'
                                        : 'border-2 border-rose-400 bg-rose-50/60 font-bold'
                                }`}
                            >
                                <div>
                                    <span className="font-mono text-2xs text-gray-500 block">[{locId}]</span>
                                    <span className="text-gray-900">{locText}</span>
                                </div>

                                <div className="text-right">
                                    <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs ${
                                            isCorrectLoc
                                                ? 'bg-emerald-200 text-emerald-950'
                                                : 'bg-rose-200 text-rose-950'
                                        }`}
                                    >
                                        {isCorrectLoc ? (
                                            <Check className="h-3 w-3 text-emerald-800 stroke-[3]" />
                                        ) : (
                                            <X className="h-3 w-3 text-rose-800 stroke-[3]" />
                                        )}
                                        Pin: {uPin || '(Chưa chọn)'}
                                    </span>
                                    {!isCorrectLoc && cPin && (
                                        <div className="text-2xs font-bold text-emerald-800 mt-1">
                                            Đáp án đúng: Pin {cPin}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 10. Render Find Mistake Review
    // -----------------------------------------------------------------
    if (question_type === 'find_mistake') {
        const segs = Array.isArray(options?.sentence_segments) ? options.sentence_segments : [];
        const correctSegId = String(correct_answer ?? '');
        const userSegId = user_answer !== null && user_answer !== undefined ? String(user_answer) : null;

        return (
            <div className="space-y-3 pt-2">
                {segs.length > 0 ? (
                    <div className="p-4 bg-white rounded-2xl border border-gray-200 leading-loose text-xs sm:text-sm font-medium text-gray-900 shadow-2xs">
                        {segs.map((seg: any, idx: number) => {
                            if (seg.underlined) {
                                const segId = String(seg.id ?? '');
                                const isCorrectMistake = segId === correctSegId;
                                const isUserSelected = segId === userSegId;

                                let styleClass = 'border-gray-200 bg-slate-50 text-gray-800';
                                if (isCorrectMistake && isUserSelected) {
                                    styleClass = 'border-2 border-emerald-500 bg-emerald-100 text-emerald-950 font-bold shadow-xs';
                                } else if (isCorrectMistake) {
                                    styleClass = 'border-2 border-emerald-500 bg-emerald-100 text-emerald-950 font-bold shadow-xs';
                                } else if (isUserSelected) {
                                    styleClass = 'border-2 border-rose-500 bg-rose-100 text-rose-950 font-bold shadow-xs';
                                }

                                return (
                                    <span
                                        key={idx}
                                        className={`inline-flex flex-col items-center mx-1 px-2.5 py-1 rounded-xl border ${styleClass}`}
                                    >
                                        <span>{seg.text}</span>
                                        <span className="text-3xs font-mono font-black mt-0.5">
                                            ({segId}) {isCorrectMistake ? '✓ Lỗi sai' : isUserSelected ? '✗ Bạn chọn' : ''}
                                        </span>
                                    </span>
                                );
                            }
                            return <span key={idx}>{seg.text}</span>;
                        })}
                    </div>
                ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border text-xs">
                        <span className="font-bold">Phương án sai: </span>
                        <span className="text-emerald-700 font-bold">{correctSegId}</span>
                        {userSegId && userSegId !== correctSegId && (
                            <span className="text-rose-700 font-bold ml-2">(Bạn đã chọn: {userSegId})</span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // -----------------------------------------------------------------
    // 11. Render Essay / Audio Record Review
    // -----------------------------------------------------------------
    if (question_type === 'essay') {
        return (
            <div className="space-y-3 pt-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2 text-xs">
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-gray-500 block">
                        Bài viết tự luận của học sinh:
                    </span>
                    <p className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {String(user_answer || '(Chưa nộp bài viết)')}
                    </p>
                </div>
            </div>
        );
    }

    if (question_type === 'audio_record') {
        return (
            <div className="space-y-3 pt-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2 text-xs">
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-gray-500 block">
                        Bản ghi âm bài nói của học sinh:
                    </span>
                    {user_answer ? (
                        <audio
                            src={`/class-exams/audio-stream?path=${encodeURIComponent(String(user_answer))}`}
                            controls
                            className="w-full h-8"
                        />
                    ) : (
                        <span className="text-gray-400 italic">Chưa ghi âm</span>
                    )}
                </div>
            </div>
        );
    }

    // Fallback default
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1">
                <span className="text-2xs font-bold text-gray-500 uppercase">Bạn đã chọn:</span>
                <div className="font-bold text-rose-700 font-mono">
                    {user_answer ? JSON.stringify(user_answer) : '(Chưa chọn)'}
                </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-1">
                <span className="text-2xs font-bold text-emerald-800 uppercase">Đáp án chuẩn:</span>
                <div className="font-bold text-emerald-900 font-mono">
                    {JSON.stringify(correct_answer)}
                </div>
            </div>
        </div>
    );
}

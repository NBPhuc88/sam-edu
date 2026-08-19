import React, { useState } from 'react';
import {
    Plus,
    Trash2,
    Copy,
    ChevronUp,
    ChevronDown,
    CheckCircle2,
    ListChecks,
    HelpCircle,
    FileText,
    GitMerge,
    ArrowUpDown,
    MapPin,
    AlertTriangle,
    PenTool,
    Mic,
    Sparkles,
    Image as ImageIcon,
    Volume2,
    HelpCircle as QuestionIcon,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import SingleChoiceEditor from './QuestionEditors/SingleChoiceEditor';
import MultipleChoiceEditor from './QuestionEditors/MultipleChoiceEditor';
import TrueFalseEditor from './QuestionEditors/TrueFalseEditor';
import FillInBlankEditor from './QuestionEditors/FillInBlankEditor';
import MatchingEditor from './QuestionEditors/MatchingEditor';
import OrderingEditor from './QuestionEditors/OrderingEditor';
import DiagramLabellingEditor from './QuestionEditors/DiagramLabellingEditor';
import FindMistakeEditor from './QuestionEditors/FindMistakeEditor';
import EssayEditor from './QuestionEditors/EssayEditor';
import AudioRecordEditor from './QuestionEditors/AudioRecordEditor';
import { ExamQuestionData, QuestionType, QUESTION_TYPES } from './types';

interface Props {
    questions: ExamQuestionData[];
    onChangeQuestions: (questions: ExamQuestionData[]) => void;
    examMaxScore: number | string;
}

export default function QuestionBuilder({
    questions = [],
    onChangeQuestions,
    examMaxScore = 10,
}: Props) {
    const [activeQuestionTypeModal, setActiveQuestionTypeModal] = useState(false);
    const [expandedQuestionIndexes, setExpandedQuestionIndexes] = useState<number[]>([0]);

    // Calculate total score of all questions
    const totalScore = questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);

    const toggleExpand = (index: number) => {
        if (expandedQuestionIndexes.includes(index)) {
            setExpandedQuestionIndexes(expandedQuestionIndexes.filter((i) => i !== index));
        } else {
            setExpandedQuestionIndexes([...expandedQuestionIndexes, index]);
        }
    };

    const expandAll = () => {
        setExpandedQuestionIndexes(questions.map((_, i) => i));
    };

    const collapseAll = () => {
        setExpandedQuestionIndexes([]);
    };

    const handleSelectQuestionType = (type: QuestionType) => {
        const nextIdx = questions.length;
        const newQuestion: ExamQuestionData = {
            code: `Q${String(nextIdx + 1).padStart(9, '0')}`,
            question_type: type,
            content: '',
            score: 1.00,
            image_url: null,
            audio_url: null,
            options: getDefaultOptions(type),
            correct_answer: getDefaultCorrectAnswer(type),
            explanation: '',
            metadata: getDefaultMetadata(type),
            order_index: nextIdx,
        };

        const updated = [...questions, newQuestion];
        onChangeQuestions(updated);
        setExpandedQuestionIndexes([...expandedQuestionIndexes, nextIdx]);
        setActiveQuestionTypeModal(false);
    };

    const getDefaultOptions = (type: QuestionType) => {
        switch (type) {
            case 'single_choice':
                return [
                    { id: 'A', text: '' },
                    { id: 'B', text: '' },
                    { id: 'C', text: '' },
                    { id: 'D', text: '' },
                ];
            case 'multiple_choice':
                return [
                    { id: 'A', text: '' },
                    { id: 'B', text: '' },
                    { id: 'C', text: '' },
                    { id: 'D', text: '' },
                    { id: 'E', text: '' },
                ];
            case 'true_false_not_given':
                return [
                    { id: 'TRUE', label: 'TRUE (Đúng)' },
                    { id: 'FALSE', label: 'FALSE (Sai)' },
                    { id: 'NOT_GIVEN', label: 'NOT GIVEN (Không có thông tin)' },
                ];
            case 'matching':
                return {
                    left_items: [
                        { id: 'L1', label: 'Paragraph A' },
                        { id: 'L2', label: 'Paragraph B' },
                        { id: 'L3', label: 'Paragraph C' },
                    ],
                    right_items: [
                        { id: 'R1', text: 'i. Tiêu đề mục 1' },
                        { id: 'R2', text: 'ii. Tiêu đề mục 2' },
                        { id: 'R3', text: 'iii. Tiêu đề mục 3' },
                    ],
                };
            case 'ordering':
                return [
                    { id: 't1', text: 'Mẩu từ 1' },
                    { id: 't2', text: 'Mẩu từ 2' },
                    { id: 't3', text: 'Mẩu từ 3' },
                ];
            case 'diagram_labelling':
                return {
                    labels: [
                        { id: 'loc_1', text: 'Vị trí 1' },
                        { id: 'loc_2', text: 'Vị trí 2' },
                    ],
                    map_pins: ['A', 'B', 'C', 'D'],
                };
            case 'find_mistake':
                return {
                    sentence_segments: [
                        { id: 's1', text: 'Đoạn đầu câu ', underlined: false },
                        { id: 'A', text: 'phần gạch chân 1', underlined: true },
                        { id: 's2', text: ' đoạn giữa ', underlined: false },
                        { id: 'B', text: 'phần gạch chân 2', underlined: true },
                        { id: 's3', text: ' kết câu.', underlined: false },
                    ],
                };
            default:
                return null;
        }
    };

    const getDefaultCorrectAnswer = (type: QuestionType) => {
        switch (type) {
            case 'single_choice':
                return 'A';
            case 'multiple_choice':
                return ['A', 'B'];
            case 'true_false_not_given':
                return 'TRUE';
            case 'fill_in_blank':
                return {
                    blank_1: { accepted_answers: [''], case_sensitive: false },
                };
            case 'matching':
                return { L1: 'R1', L2: 'R2', L3: 'R3' };
            case 'ordering':
                return ['t1', 't2', 't3'];
            case 'diagram_labelling':
                return { loc_1: 'A', loc_2: 'B' };
            case 'find_mistake':
                return 'A';
            default:
                return null;
        }
    };

    const getDefaultMetadata = (type: QuestionType) => {
        switch (type) {
            case 'multiple_choice':
                return { max_select: 2 };
            case 'true_false_not_given':
                return { variant: 'T_F_NG' };
            case 'fill_in_blank':
                return { word_limit: '', word_bank: [] };
            case 'essay':
                return {
                    min_words: 250,
                    rubrics: [
                        { criteria: 'Task Achievement', max_score: 2.5 },
                        { criteria: 'Coherence & Cohesion', max_score: 2.5 },
                        { criteria: 'Lexical Resource', max_score: 2.5 },
                        { criteria: 'Grammatical Range', max_score: 2.5 },
                    ],
                };
            case 'audio_record':
                return { prep_time_seconds: 60, max_record_duration_seconds: 120 };
            default:
                return {};
        }
    };

    const handleUpdateQuestion = (index: number, updatedFields: Partial<ExamQuestionData>) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], ...updatedFields };
        onChangeQuestions(updated);
    };

    const handleDuplicateQuestion = (index: number) => {
        const target = questions[index];
        const clone: ExamQuestionData = {
            ...JSON.parse(JSON.stringify(target)),
            id: undefined,
            code: `Q${String(questions.length + 1).padStart(9, '0')}`,
            order_index: questions.length,
        };
        const updated = [...questions, clone];
        onChangeQuestions(updated);
        setExpandedQuestionIndexes([...expandedQuestionIndexes, questions.length]);
    };

    const handleDeleteQuestion = (index: number) => {
        const updated = questions.filter((_, i) => i !== index);
        onChangeQuestions(updated);
        setExpandedQuestionIndexes(
            expandedQuestionIndexes
                .filter((i) => i !== index)
                .map((i) => (i > index ? i - 1 : i)),
        );
    };

    const handleMoveQuestion = (fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= questions.length) return;
        const updated = [...questions];
        const [moved] = updated.splice(fromIdx, 1);
        updated.splice(toIdx, 0, moved);
        onChangeQuestions(updated);
    };

    const handleInsertBlankTag = (questionIndex: number) => {
        const q = questions[questionIndex];
        const matches = (q.content || '').match(/\[blank_\d+\]/g) || [];
        const nextNum = matches.length + 1;
        const newTag = `[blank_${nextNum}]`;

        const newContent = q.content ? `${q.content} ${newTag}` : newTag;
        const currentAns = { ...(q.correct_answer || {}) };
        if (!currentAns[`blank_${nextNum}`]) {
            currentAns[`blank_${nextNum}`] = {
                accepted_answers: [''],
                case_sensitive: false,
            };
        }

        handleUpdateQuestion(questionIndex, {
            content: newContent,
            correct_answer: currentAns,
        });
    };

    const getTypeIcon = (type: QuestionType) => {
        switch (type) {
            case 'single_choice':
                return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
            case 'multiple_choice':
                return <ListChecks className="h-4 w-4 text-indigo-600" />;
            case 'true_false_not_given':
                return <HelpCircle className="h-4 w-4 text-emerald-600" />;
            case 'fill_in_blank':
                return <FileText className="h-4 w-4 text-amber-600" />;
            case 'matching':
                return <GitMerge className="h-4 w-4 text-purple-600" />;
            case 'ordering':
                return <ArrowUpDown className="h-4 w-4 text-cyan-600" />;
            case 'diagram_labelling':
                return <MapPin className="h-4 w-4 text-teal-600" />;
            case 'find_mistake':
                return <AlertTriangle className="h-4 w-4 text-rose-600" />;
            case 'essay':
                return <PenTool className="h-4 w-4 text-orange-600" />;
            case 'audio_record':
                return <Mic className="h-4 w-4 text-pink-600" />;
            default:
                return <QuestionIcon className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
                <div>
                    <h2 className="flex items-center gap-2.5 text-xl font-bold text-gray-900">
                        <Sparkles className="h-6 w-6 text-emerald-600" />
                        2. Soạn Thảo Bộ Câu Hỏi (Question Builder)
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                        Tích hợp 10 kiểu câu hỏi tiêu chuẩn (IELTS, HSK, TOEIC, THPT, Tự luận & Khẩu ngữ).
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Score Counter Badge */}
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200">
                        <span className="text-xs text-gray-500">Tổng điểm:</span>
                        <span className={`font-mono text-sm font-extrabold ${
                            Number(totalScore) === Number(examMaxScore)
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                        }`}>
                            {totalScore} / {examMaxScore} điểm
                        </span>
                    </div>

                    <Button
                        type="button"
                        variant="success"
                        size="md"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => setActiveQuestionTypeModal(true)}
                    >
                        Thêm Câu Hỏi
                    </Button>
                </div>
            </div>

            {/* Quick Actions (Expand/Collapse all) */}
            {questions.length > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                    <span>
                        Tổng cộng: <strong className="text-gray-900">{questions.length}</strong> câu hỏi
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={expandAll}
                            className="hover:text-emerald-700 font-medium"
                        >
                            Mở rộng tất cả
                        </button>
                        <span>•</span>
                        <button
                            type="button"
                            onClick={collapseAll}
                            className="hover:text-emerald-700 font-medium"
                        >
                            Thu gọn tất cả
                        </button>
                    </div>
                </div>
            )}

            {/* Questions List */}
            {questions.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center bg-gray-50/50">
                    <Sparkles className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-3 text-sm font-bold text-gray-800">
                        Chưa có câu hỏi nào trong đề thi này
                    </p>
                    <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
                        Bấm nút bên dưới để chọn dạng câu hỏi (Trắc nghiệm, Nối cột, Điền từ, Sơ đồ, Tự luận, v.v.).
                    </p>
                    <div className="mt-5">
                        <Button
                            type="button"
                            variant="success"
                            size="md"
                            icon={<Plus className="h-4 w-4" />}
                            onClick={() => setActiveQuestionTypeModal(true)}
                        >
                            Thêm Câu Hỏi Đầu Tiên
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map((q, qIndex) => {
                        const isExpanded = expandedQuestionIndexes.includes(qIndex);
                        const typeInfo = QUESTION_TYPES.find((t) => t.type === q.question_type) || QUESTION_TYPES[0];

                        return (
                            <div
                                key={qIndex}
                                className={`rounded-2xl border transition-all duration-200 ${
                                    isExpanded
                                        ? 'border-gray-300 bg-white shadow-sm ring-1 ring-emerald-500/20'
                                        : 'border-gray-200 bg-slate-50/70 hover:border-gray-300'
                                }`}
                            >
                                {/* Question Header Bar */}
                                <div
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer select-none"
                                    onClick={() => toggleExpand(qIndex)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-mono text-xs font-extrabold text-white">
                                            {qIndex + 1}
                                        </span>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold border ${typeInfo.badgeColor}`}>
                                                {getTypeIcon(q.question_type)}
                                                {typeInfo.label}
                                            </span>

                                            <span className="text-xs text-gray-500 font-mono">
                                                ({q.code || `Q${qIndex + 1}`})
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                        {/* Score tag */}
                                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200 text-xs">
                                            <span className="text-gray-500">Điểm:</span>
                                            <input
                                                type="number"
                                                step="0.25"
                                                min={0}
                                                value={q.score}
                                                onChange={(e) => handleUpdateQuestion(qIndex, { score: e.target.value })}
                                                className="w-12 text-center font-bold text-gray-900 border-none p-0 focus:ring-0 text-xs"
                                                title="Điểm số câu hỏi"
                                            />
                                        </div>

                                        {/* Reorder Buttons */}
                                        <button
                                            type="button"
                                            disabled={qIndex === 0}
                                            onClick={() => handleMoveQuestion(qIndex, qIndex - 1)}
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                                            title="Di chuyển lên"
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={qIndex === questions.length - 1}
                                            onClick={() => handleMoveQuestion(qIndex, qIndex + 1)}
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                                            title="Di chuyển xuống"
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </button>

                                        {/* Duplicate */}
                                        <button
                                            type="button"
                                            onClick={() => handleDuplicateQuestion(qIndex)}
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                            title="Nhân bản câu hỏi"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteQuestion(qIndex)}
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                            title="Xóa câu hỏi"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>

                                        {/* Expand Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(qIndex)}
                                            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                                        >
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Question Content Preview when collapsed */}
                                {!isExpanded && q.content && (
                                    <div className="px-4 pb-3 text-xs text-gray-600 truncate border-t border-gray-100/60 pt-2">
                                        {q.content}
                                    </div>
                                )}

                                {/* Question Editor Body when expanded */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 p-5 space-y-5 bg-white rounded-b-2xl">
                                        {/* Question Prompt / Content */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-xs font-bold uppercase tracking-wider text-gray-800">
                                                    Nội Dung Câu Hỏi / Đề Bài (*)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={q.question_type}
                                                        onChange={(e) => {
                                                            const newType = e.target.value as QuestionType;
                                                            handleUpdateQuestion(qIndex, {
                                                                question_type: newType,
                                                                options: getDefaultOptions(newType),
                                                                correct_answer: getDefaultCorrectAnswer(newType),
                                                                metadata: getDefaultMetadata(newType),
                                                            });
                                                        }}
                                                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700"
                                                    >
                                                        {QUESTION_TYPES.map((t) => (
                                                            <option key={t.type} value={t.type}>
                                                                Đổi sang: {t.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <textarea
                                                rows={3}
                                                value={q.content}
                                                onChange={(e) => handleUpdateQuestion(qIndex, { content: e.target.value })}
                                                placeholder="Nhập nội dung câu hỏi hoặc yêu cầu làm bài..."
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                                required
                                            />
                                        </div>

                                        {/* Image URL & Audio URL Attachments */}
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="flex items-center gap-1 text-2xs font-semibold text-gray-600 mb-1">
                                                    <ImageIcon className="h-3 w-3 text-emerald-600" />
                                                    Đường dẫn hình ảnh đính kèm (Tùy chọn)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={q.image_url || ''}
                                                    onChange={(e) => handleUpdateQuestion(qIndex, { image_url: e.target.value || null })}
                                                    placeholder="VD: /storage/exams/images/q1_pic.png"
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                                />
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-1 text-2xs font-semibold text-gray-600 mb-1">
                                                    <Volume2 className="h-3 w-3 text-blue-600" />
                                                    Đường dẫn file Audio nghe (Tùy chọn)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={q.audio_url || ''}
                                                    onChange={(e) => handleUpdateQuestion(qIndex, { audio_url: e.target.value || null })}
                                                    placeholder="VD: /storage/exams/audio/q1_listening.mp3"
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                                />
                                            </div>
                                        </div>

                                        {/* Dynamic Question Type Specific Editor */}
                                        <div className="rounded-xl bg-slate-50/70 p-4 border border-slate-200">
                                            {q.question_type === 'single_choice' && (
                                                <SingleChoiceEditor
                                                    options={q.options || []}
                                                    correctAnswer={q.correct_answer}
                                                    onChangeOptions={(opts) => handleUpdateQuestion(qIndex, { options: opts })}
                                                    onChangeCorrectAnswer={(ans) => handleUpdateQuestion(qIndex, { correct_answer: ans })}
                                                />
                                            )}

                                            {q.question_type === 'multiple_choice' && (
                                                <MultipleChoiceEditor
                                                    options={q.options || []}
                                                    correctAnswer={q.correct_answer || []}
                                                    metadata={q.metadata || {}}
                                                    onChangeOptions={(opts) => handleUpdateQuestion(qIndex, { options: opts })}
                                                    onChangeCorrectAnswer={(ans) => handleUpdateQuestion(qIndex, { correct_answer: ans })}
                                                    onChangeMetadata={(meta) => handleUpdateQuestion(qIndex, { metadata: meta })}
                                                />
                                            )}

                                            {q.question_type === 'true_false_not_given' && (
                                                <TrueFalseEditor
                                                    correctAnswer={q.correct_answer}
                                                    metadata={q.metadata || {}}
                                                    onChangeCorrectAnswer={(ans) => handleUpdateQuestion(qIndex, { correct_answer: ans })}
                                                    onChangeMetadata={(meta) => handleUpdateQuestion(qIndex, { metadata: meta })}
                                                    onChangeOptions={(opts) => handleUpdateQuestion(qIndex, { options: opts })}
                                                />
                                            )}

                                            {q.question_type === 'fill_in_blank' && (
                                                <FillInBlankEditor
                                                    content={q.content}
                                                    correctAnswer={q.correct_answer || {}}
                                                    metadata={q.metadata || {}}
                                                    onInsertBlank={() => handleInsertBlankTag(qIndex)}
                                                    onChangeCorrectAnswer={(ans) => handleUpdateQuestion(qIndex, { correct_answer: ans })}
                                                    onChangeMetadata={(meta) => handleUpdateQuestion(qIndex, { metadata: meta })}
                                                />
                                            )}

                                            {q.question_type === 'matching' && (
                                                <MatchingEditor
                                                    options={q.options || { left_items: [], right_items: [] }}
                                                    correctAnswer={q.correct_answer || {}}
                                                    onChangeOptions={(opts) => handleUpdateQuestion(qIndex, { options: opts })}
                                                    onChangeCorrectAnswer={(ans) => handleUpdateQuestion(qIndex, { correct_answer: ans })}
                                                />
                                            )}

                                            {q.question_type === 'ordering' && (
                                                <OrderingEditor
                                                    options={q.options || []}
                                                    correctAnswer={q.correct_answer || []}
                                                    onChangeOptions={(opts) => handleUpdateQuestion(qIndex, { options: opts })}
                                                    onChangeCorrectAnswer={(ans) => handleUpdateQuestion(qIndex, { correct_answer: ans })}
                                                />
                                            )}

                                            {q.question_type === 'diagram_labelling' && (
                                                <DiagramLabellingEditor
                                                    imageUrl={q.image_url || ''}
                                                    options={q.options || { labels: [], map_pins: [] }}
                                                    correctAnswer={q.correct_answer || {}}
                                                    onChangeImageUrl={(url) => handleUpdateQuestion(qIndex, { image_url: url })}
                                                    onChangeOptions={(opts) => handleUpdateQuestion(qIndex, { options: opts })}
                                                    onChangeCorrectAnswer={(ans) => handleUpdateQuestion(qIndex, { correct_answer: ans })}
                                                />
                                            )}

                                            {q.question_type === 'find_mistake' && (
                                                <FindMistakeEditor
                                                    options={q.options || { sentence_segments: [] }}
                                                    correctAnswer={q.correct_answer}
                                                    onChangeOptions={(opts) => handleUpdateQuestion(qIndex, { options: opts })}
                                                    onChangeCorrectAnswer={(ans) => handleUpdateQuestion(qIndex, { correct_answer: ans })}
                                                />
                                            )}

                                            {q.question_type === 'essay' && (
                                                <EssayEditor
                                                    metadata={q.metadata || {}}
                                                    onChangeMetadata={(meta) => handleUpdateQuestion(qIndex, { metadata: meta })}
                                                />
                                            )}

                                            {q.question_type === 'audio_record' && (
                                                <AudioRecordEditor
                                                    metadata={q.metadata || {}}
                                                    audioUrl={q.audio_url}
                                                    onChangeMetadata={(meta) => handleUpdateQuestion(qIndex, { metadata: meta })}
                                                    onChangeAudioUrl={(url) => handleUpdateQuestion(qIndex, { audio_url: url })}
                                                />
                                            )}
                                        </div>

                                        {/* Detailed Explanation */}
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                                                Lời Giải Thích Chi Tiết / Hướng Dẫn Giải
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={q.explanation || ''}
                                                onChange={(e) => handleUpdateQuestion(qIndex, { explanation: e.target.value || null })}
                                                placeholder="Giải thích vì sao chọn đáp án này, trích dẫn bài đọc..."
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bottom Add Question Button */}
            {questions.length > 0 && (
                <div className="flex justify-center pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        icon={<Plus className="h-4 w-4 text-emerald-600" />}
                        onClick={() => setActiveQuestionTypeModal(true)}
                    >
                        Thêm Câu Hỏi Tiếp Theo
                    </Button>
                </div>
            )}

            {/* Question Type Selection Modal */}
            <Modal
                isOpen={activeQuestionTypeModal}
                onClose={() => setActiveQuestionTypeModal(false)}
                title="Chọn Kiểu Câu Hỏi Cần Tạo (10 Dạng Câu Hỏi)"
                maxWidth="4xl"
            >
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                        Chọn một trong 10 dạng câu hỏi dưới đây để thêm vào bài kiểm tra:
                    </p>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 max-h-[65vh] overflow-y-auto p-1">
                        {QUESTION_TYPES.map((typeMeta) => (
                            <button
                                key={typeMeta.type}
                                type="button"
                                onClick={() => handleSelectQuestionType(typeMeta.type)}
                                className="group flex flex-col justify-between text-left rounded-2xl border border-gray-200 bg-white p-4.5 shadow-2xs hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-md transition-all duration-200"
                            >
                                <div className="space-y-2.5 w-full">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-gray-700 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors shadow-2xs">
                                                {getTypeIcon(typeMeta.type)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 group-hover:text-emerald-800 leading-tight">
                                                    {typeMeta.label}
                                                </h4>
                                                <span className="text-2xs font-mono text-gray-400">
                                                    {typeMeta.type}
                                                </span>
                                            </div>
                                        </div>

                                        {typeMeta.autoGraded ? (
                                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-bold text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                                ✓ Tự chấm
                                            </span>
                                        ) : (
                                            <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-2xs font-bold text-amber-700 border border-amber-200 whitespace-nowrap">
                                                ✎ GV chấm
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-500 leading-relaxed pl-0.5">
                                        {typeMeta.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </Card>
    );
}

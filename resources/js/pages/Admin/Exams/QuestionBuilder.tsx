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
    Headphones,
    BookOpen,
    Layers,
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
import {
    ExamQuestionData,
    ExamSkill,
    EXAM_SKILLS,
    QuestionType,
    QUESTION_TYPES,
} from './types';

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
    const [selectedSkillTab, setSelectedSkillTab] = useState<ExamSkill | 'all'>('all');
    const [modalSkillFilter, setModalSkillFilter] = useState<ExamSkill>('listening');
    const [expandedQuestionIndexes, setExpandedQuestionIndexes] = useState<number[]>([0]);
    const [expandedImageIndexes, setExpandedImageIndexes] = useState<number[]>([]);

    // Calculate total score of all questions
    const totalScore = questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);

    // Calculate count and score per skill
    const skillStats = {
        listening: {
            count: questions.filter((q) => (q.skill || 'reading') === 'listening').length,
            score: questions
                .filter((q) => (q.skill || 'reading') === 'listening')
                .reduce((s, q) => s + (Number(q.score) || 0), 0),
        },
        reading: {
            count: questions.filter((q) => (q.skill || 'reading') === 'reading').length,
            score: questions
                .filter((q) => (q.skill || 'reading') === 'reading')
                .reduce((s, q) => s + (Number(q.score) || 0), 0),
        },
        writing: {
            count: questions.filter((q) => (q.skill || 'reading') === 'writing').length,
            score: questions
                .filter((q) => (q.skill || 'reading') === 'writing')
                .reduce((s, q) => s + (Number(q.score) || 0), 0),
        },
        speaking: {
            count: questions.filter((q) => (q.skill || 'reading') === 'speaking').length,
            score: questions
                .filter((q) => (q.skill || 'reading') === 'speaking')
                .reduce((s, q) => s + (Number(q.score) || 0), 0),
        },
    };

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

    const toggleImageAttachment = (index: number) => {
        if (expandedImageIndexes.includes(index)) {
            setExpandedImageIndexes(expandedImageIndexes.filter((i) => i !== index));
        } else {
            setExpandedImageIndexes([...expandedImageIndexes, index]);
        }
    };

    const handleOpenAddModal = (targetSkill?: ExamSkill | 'all') => {
        const skill: ExamSkill = (targetSkill && targetSkill !== 'all')
            ? targetSkill
            : (selectedSkillTab !== 'all' ? selectedSkillTab : 'listening');
        setModalSkillFilter(skill);
        setActiveQuestionTypeModal(true);
    };

    const handleSelectQuestionType = (type: QuestionType, targetSkill?: ExamSkill) => {
        const nextIdx = questions.length;
        const skill: ExamSkill = targetSkill || modalSkillFilter;

        const newQuestion: ExamQuestionData = {
            code: `Q${String(nextIdx + 1).padStart(9, '0')}`,
            skill,
            question_type: type,
            content: '',
            score: 1.00,
            image_url: null,
            audio_url: skill === 'listening' ? '' : null,
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
                return <HelpCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getSkillBadge = (skill?: ExamSkill) => {
        switch (skill) {
            case 'listening':
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-2xs font-bold text-blue-700 border border-blue-200">
                        <Headphones className="h-3 w-3 text-blue-600" />
                        Nghe (Listening)
                    </span>
                );
            case 'writing':
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-2xs font-bold text-amber-700 border border-amber-200">
                        <PenTool className="h-3 w-3 text-amber-600" />
                        Viết (Writing)
                    </span>
                );
            case 'speaking':
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-pink-50 px-2 py-0.5 text-2xs font-bold text-pink-700 border border-pink-200">
                        <Mic className="h-3 w-3 text-pink-600" />
                        Nói (Speaking)
                    </span>
                );
            case 'reading':
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-2xs font-bold text-emerald-700 border border-emerald-200">
                        <BookOpen className="h-3 w-3 text-emerald-600" />
                        Đọc (Reading)
                    </span>
                );
        }
    };

    // Filter questions based on selected tab
    const filteredQuestions = selectedSkillTab === 'all'
        ? questions
        : questions.filter((q) => (q.skill || 'reading') === selectedSkillTab);

    // Filter modal types based on modal skill filter
    const modalQuestionsTypes = modalSkillFilter === 'all'
        ? QUESTION_TYPES
        : QUESTION_TYPES.filter((t) => t.skills.includes(modalSkillFilter));

    return (
        <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8 space-y-6">
            {/* Header & Overall KPI */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
                <div>
                    <h2 className="flex items-center gap-2.5 text-xl font-bold text-gray-900">
                        <Sparkles className="h-6 w-6 text-emerald-600" />
                        2. Soạn Thảo Bộ Câu Hỏi (Theo 4 Kỹ Năng: Nghe, Đọc, Viết, Nói)
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                        Phân loại đề thi theo 4 kỹ năng chuẩn hóa quốc tế (IELTS, HSK, TOEIC) và các kiểu câu hỏi tương ứng.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Score Counter Badge */}
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200">
                        <span className="text-xs text-gray-500">Tổng điểm:</span>
                        <span
                            className={`font-mono text-sm font-extrabold ${
                                Number(totalScore) === Number(examMaxScore)
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                            }`}
                        >
                            {totalScore} / {examMaxScore} điểm
                        </span>
                    </div>

                    <Button
                        type="button"
                        variant="success"
                        size="md"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => handleOpenAddModal(selectedSkillTab)}
                    >
                        Thêm Câu Hỏi
                    </Button>
                </div>
            </div>

            {/* 4 Skills Navigation Tabs & KPI Badges */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 p-1 rounded-xl bg-slate-100/80 border border-slate-200">
                <button
                    type="button"
                    onClick={() => setSelectedSkillTab('all')}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-bold transition-all ${
                        selectedSkillTab === 'all'
                            ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                >
                    <Layers className="h-4 w-4 text-gray-500" />
                    <span>Tất Cả ({questions.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setSelectedSkillTab('listening')}
                    className={`flex items-center justify-between rounded-lg py-2.5 px-3 text-xs font-bold transition-all ${
                        selectedSkillTab === 'listening'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-700 hover:bg-white/50'
                    }`}
                >
                    <div className="flex items-center gap-1.5">
                        <Headphones className={`h-4 w-4 ${selectedSkillTab === 'listening' ? 'text-white' : 'text-blue-600'}`} />
                        <span>🎧 Nghe</span>
                    </div>
                    <span className={`font-mono text-2xs px-1.5 py-0.5 rounded-full ${
                        selectedSkillTab === 'listening' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
                    }`}>
                        {skillStats.listening.count} câu
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setSelectedSkillTab('reading')}
                    className={`flex items-center justify-between rounded-lg py-2.5 px-3 text-xs font-bold transition-all ${
                        selectedSkillTab === 'reading'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-gray-700 hover:bg-white/50'
                    }`}
                >
                    <div className="flex items-center gap-1.5">
                        <BookOpen className={`h-4 w-4 ${selectedSkillTab === 'reading' ? 'text-white' : 'text-emerald-600'}`} />
                        <span>📖 Đọc</span>
                    </div>
                    <span className={`font-mono text-2xs px-1.5 py-0.5 rounded-full ${
                        selectedSkillTab === 'reading' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                        {skillStats.reading.count} câu
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setSelectedSkillTab('writing')}
                    className={`flex items-center justify-between rounded-lg py-2.5 px-3 text-xs font-bold transition-all ${
                        selectedSkillTab === 'writing'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-gray-700 hover:bg-white/50'
                    }`}
                >
                    <div className="flex items-center gap-1.5">
                        <PenTool className={`h-4 w-4 ${selectedSkillTab === 'writing' ? 'text-white' : 'text-amber-600'}`} />
                        <span>✍️ Viết</span>
                    </div>
                    <span className={`font-mono text-2xs px-1.5 py-0.5 rounded-full ${
                        selectedSkillTab === 'writing' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                        {skillStats.writing.count} câu
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setSelectedSkillTab('speaking')}
                    className={`flex items-center justify-between rounded-lg py-2.5 px-3 text-xs font-bold transition-all ${
                        selectedSkillTab === 'speaking'
                            ? 'bg-pink-600 text-white shadow-xs'
                            : 'text-gray-700 hover:bg-white/50'
                    }`}
                >
                    <div className="flex items-center gap-1.5">
                        <Mic className={`h-4 w-4 ${selectedSkillTab === 'speaking' ? 'text-white' : 'text-pink-600'}`} />
                        <span>🗣️ Nói</span>
                    </div>
                    <span className={`font-mono text-2xs px-1.5 py-0.5 rounded-full ${
                        selectedSkillTab === 'speaking' ? 'bg-pink-700 text-white' : 'bg-pink-100 text-pink-800'
                    }`}>
                        {skillStats.speaking.count} câu
                    </span>
                </button>
            </div>

            {/* Quick Actions (Expand/Collapse all) */}
            {questions.length > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                    <span>
                        Đang xem:{' '}
                        <strong className="text-gray-900">
                            {selectedSkillTab === 'all'
                                ? 'Tất cả kỹ năng'
                                : EXAM_SKILLS.find((s) => s.skill === selectedSkillTab)?.label}
                        </strong>{' '}
                        ({filteredQuestions.length} / {questions.length} câu hỏi)
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
            {filteredQuestions.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center bg-gray-50/50">
                    <Sparkles className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-3 text-sm font-bold text-gray-800">
                        {selectedSkillTab === 'all'
                            ? 'Chưa có câu hỏi nào trong đề thi này'
                            : `Chưa có câu hỏi nào thuộc ${EXAM_SKILLS.find((s) => s.skill === selectedSkillTab)?.label}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
                        Bấm nút bên dưới để chọn dạng câu hỏi phù hợp cho kỹ năng này.
                    </p>
                    <div className="mt-5">
                        <Button
                            type="button"
                            variant="success"
                            size="md"
                            icon={<Plus className="h-4 w-4" />}
                            onClick={() => handleOpenAddModal(selectedSkillTab)}
                        >
                            Thêm Câu Hỏi Cho {selectedSkillTab === 'all' ? 'Đề Thi' : EXAM_SKILLS.find((s) => s.skill === selectedSkillTab)?.label}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map((q, qIndex) => {
                        // Check if item is included in current filter
                        if (selectedSkillTab !== 'all' && (q.skill || 'reading') !== selectedSkillTab) {
                            return null;
                        }

                        const isExpanded = expandedQuestionIndexes.includes(qIndex);
                        const typeInfo = QUESTION_TYPES.find((t) => t.type === q.question_type) || QUESTION_TYPES[0];
                        const currentSkill = q.skill || 'reading';
                        const isListening = currentSkill === 'listening';

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
                                            {getSkillBadge(q.skill)}

                                            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold border ${typeInfo.badgeColor}`}>
                                                {getTypeIcon(q.question_type)}
                                                {typeInfo.label}
                                            </span>

                                            <span className="text-xs text-gray-400 font-mono">
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
                                        {/* Question Header Controls: Skill Selector & Type Selector */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-700">Kỹ Năng:</span>
                                                <select
                                                    value={q.skill || 'reading'}
                                                    onChange={(e) => {
                                                        const newSkill = e.target.value as ExamSkill;
                                                        const validTypes = QUESTION_TYPES.filter((t) => t.skills.includes(newSkill));
                                                        const isCurrentValid = validTypes.some((t) => t.type === q.question_type);
                                                        const fallbackType = isCurrentValid ? q.question_type : validTypes[0]?.type || 'single_choice';

                                                        handleUpdateQuestion(qIndex, {
                                                            skill: newSkill,
                                                            question_type: fallbackType,
                                                            audio_url: newSkill === 'listening' ? q.audio_url || '' : null,
                                                            ...(isCurrentValid ? {} : {
                                                                options: getDefaultOptions(fallbackType),
                                                                correct_answer: getDefaultCorrectAnswer(fallbackType),
                                                                metadata: getDefaultMetadata(fallbackType),
                                                            }),
                                                        });
                                                    }}
                                                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-2xs"
                                                >
                                                    <option value="listening">🎧 Kỹ Năng Nghe (Listening)</option>
                                                    <option value="reading">📖 Kỹ Năng Đọc (Reading)</option>
                                                    <option value="writing">✍️ Kỹ Năng Viết (Writing)</option>
                                                    <option value="speaking">🗣️ Kỹ Năng Nói (Speaking)</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-700">Kiểu Mẫu Câu:</span>
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
                                                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-2xs"
                                                >
                                                    {QUESTION_TYPES.filter((t) => t.skills.includes(q.skill || 'reading')).map((t) => (
                                                        <option key={t.type} value={t.type}>
                                                            {t.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Audio Section: ONLY SHOWN FOR LISTENING QUESTIONS */}
                                        {isListening && (
                                            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-900">
                                                        <Volume2 className="h-4 w-4 text-blue-600" />
                                                        Đường Dẫn File Audio Nghe (Listening Track MP3) (*)
                                                    </label>
                                                    <span className="text-2xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                                        Phần Nghe
                                                    </span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={q.audio_url || ''}
                                                    onChange={(e) => handleUpdateQuestion(qIndex, { audio_url: e.target.value || null })}
                                                    placeholder="VD: /storage/exams/audio/ielts_listening_section1.mp3 hoặc link file audio trực tuyến..."
                                                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden"
                                                />
                                                {q.audio_url && (
                                                    <div className="mt-2 p-2 bg-white rounded-lg border border-blue-200 shadow-2xs">
                                                        <audio controls src={q.audio_url} className="w-full h-8" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Question Prompt / Content */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-xs font-bold uppercase tracking-wider text-gray-800">
                                                    Nội Dung Câu Hỏi / Đề Bài (*)
                                                </label>
                                                {/* Optional image toggle for non-diagram questions */}
                                                {q.question_type !== 'diagram_labelling' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleImageAttachment(qIndex)}
                                                        className="text-2xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                                                    >
                                                        <ImageIcon className="h-3 w-3 text-emerald-600" />
                                                        <span>{q.image_url || expandedImageIndexes.includes(qIndex) ? 'Đóng ảnh đính kèm' : '+ Đính kèm ảnh đề bài'}</span>
                                                    </button>
                                                )}
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

                                        {/* Image Attachment (Only if requested or has value) */}
                                        {q.question_type !== 'diagram_labelling' && (q.image_url || expandedImageIndexes.includes(qIndex)) && (
                                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-emerald-900">
                                                        <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                                                        Đường Dẫn Hình Ảnh Minh Họa (Image URL)
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            toggleImageAttachment(qIndex);
                                                            handleUpdateQuestion(qIndex, { image_url: null });
                                                        }}
                                                        className="text-2xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
                                                    >
                                                        Xóa ảnh
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={q.image_url || ''}
                                                    onChange={(e) => handleUpdateQuestion(qIndex, { image_url: e.target.value || null })}
                                                    placeholder="VD: /storage/exams/images/question_diagram.png..."
                                                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                                />
                                                {q.image_url && (
                                                    <div className="mt-2 rounded-lg border border-emerald-200 p-2 bg-white max-h-40 overflow-hidden flex items-center justify-center">
                                                        <img
                                                            src={q.image_url}
                                                            alt="Preview đề bài"
                                                            className="max-h-36 object-contain rounded"
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

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
                                                placeholder="Giải thích vì sao chọn đáp án này, trích dẫn bài đọc / đoạn nghe..."
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
                        onClick={() => handleOpenAddModal(selectedSkillTab)}
                    >
                        Thêm Câu Hỏi Tiếp Theo Cho {selectedSkillTab === 'all' ? 'Đề Thi' : EXAM_SKILLS.find((s) => s.skill === selectedSkillTab)?.label}
                    </Button>
                </div>
            )}

            {/* Question Type Selection Modal with Skill Filter */}
            <Modal
                isOpen={activeQuestionTypeModal}
                onClose={() => setActiveQuestionTypeModal(false)}
                title="Chọn Kiểu Mẫu Câu Hỏi Theo 4 Kỹ Năng"
                maxWidth="4xl"
            >
                <div className="space-y-4">
                    {/* Modal Skill Selector Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-gray-100 pb-3">
                        {EXAM_SKILLS.map((sk) => {
                            const typesCount = QUESTION_TYPES.filter((t) => t.skills.includes(sk.skill)).length;
                            const isActive = modalSkillFilter === sk.skill;
                            return (
                                <button
                                    key={sk.skill}
                                    type="button"
                                    onClick={() => setModalSkillFilter(sk.skill)}
                                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
                                        isActive
                                            ? sk.skill === 'listening'
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : sk.skill === 'reading'
                                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                  : sk.skill === 'writing'
                                                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                                    : 'bg-pink-600 text-white border-pink-600 shadow-xs'
                                            : 'bg-slate-50 text-gray-700 border-gray-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {sk.skill === 'listening' && <Headphones className="h-3.5 w-3.5" />}
                                        {sk.skill === 'reading' && <BookOpen className="h-3.5 w-3.5" />}
                                        {sk.skill === 'writing' && <PenTool className="h-3.5 w-3.5" />}
                                        {sk.skill === 'speaking' && <Mic className="h-3.5 w-3.5" />}
                                        <span>{sk.label}</span>
                                    </div>
                                    <span className={`text-2xs px-1.5 py-0.5 rounded-full font-mono ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        {typesCount} mẫu
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <p className="text-xs text-gray-500">
                        Chọn một trong các dạng câu hỏi tương thích với <strong className="text-gray-900">{EXAM_SKILLS.find((s) => s.skill === modalSkillFilter)?.label}</strong>:
                    </p>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 max-h-[60vh] overflow-y-auto p-1">
                        {modalQuestionsTypes.map((typeMeta) => (
                            <button
                                key={typeMeta.type}
                                type="button"
                                onClick={() => handleSelectQuestionType(typeMeta.type, modalSkillFilter)}
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
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {typeMeta.skills.map((sk) => (
                                                        <span
                                                            key={sk}
                                                            className="text-3xs uppercase font-bold tracking-wider text-gray-400"
                                                        >
                                                            #{sk}
                                                        </span>
                                                    ))}
                                                </div>
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

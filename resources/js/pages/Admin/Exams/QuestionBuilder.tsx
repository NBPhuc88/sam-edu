import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MediaUploader from '@/components/ui/MediaUploader';
import Modal from '@/components/ui/Modal';
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
SKILL_LISTENING,
SKILL_READING,
SKILL_SPEAKING,
SKILL_WRITING,
} from '@/constants/enums';
import {
AlertCircle,
AlertTriangle,
AlignLeft,
ArrowUpDown,
BookOpen,
CheckCircle2,
ChevronDown,
ChevronRight,
ChevronUp,
Copy,
Edit3,
FileText,
GitMerge,
Headphones,
HelpCircle,
Image as ImageIcon,
Layers,
ListChecks,
MapPin,
Mic,
PenTool,
Plus,
Sparkles,
Trash2
} from 'lucide-react';
import React,{ useEffect,useState } from 'react';
import AudioRecordEditor from './QuestionEditors/AudioRecordEditor';
import DiagramLabellingEditor from './QuestionEditors/DiagramLabellingEditor';
import DragDropClozeEditor from './QuestionEditors/DragDropClozeEditor';
import EssayEditor from './QuestionEditors/EssayEditor';
import FillInBlankEditor from './QuestionEditors/FillInBlankEditor';
import FindMistakeEditor from './QuestionEditors/FindMistakeEditor';
import MatchingEditor from './QuestionEditors/MatchingEditor';
import MatchingImageEditor from './QuestionEditors/MatchingImageEditor';
import MultipleChoiceEditor from './QuestionEditors/MultipleChoiceEditor';
import OrderingEditor from './QuestionEditors/OrderingEditor';
import SingleChoiceEditor from './QuestionEditors/SingleChoiceEditor';
import TrueFalseEditor from './QuestionEditors/TrueFalseEditor';
import {
EXAM_SKILLS,
ExamQuestionData,
ExamSectionData,
ExamSkill,
QUESTION_TYPES,
QuestionType,
} from './types';

interface Props {
    sections: ExamSectionData[];
    onChangeSections: (sections: ExamSectionData[]) => void;
    examMaxScore: number | string;
    errors?: Record<string, string>;
}

export default function QuestionBuilder({
    sections = [],
    onChangeSections,
    examMaxScore = 10,
    errors = {},
}: Props) {
    // Modal states
    const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
    const [newSectionSkill, setNewSectionSkill] = useState<ExamSkill>(SKILL_READING);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newSectionDescription, setNewSectionDescription] = useState('');

    const [activeQuestionModalSectionIdx, setActiveQuestionModalSectionIdx] = useState<number | null>(null);

    // Confirm Dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string | React.ReactNode;
        type: 'danger' | 'warning' | 'info';
        confirmText?: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        onConfirm: () => { },
    });

    // Expand states
    const [expandedSectionIndexes, setExpandedSectionIndexes] = useState<number[]>([0]);
    const [expandedQuestionKeys, setExpandedQuestionKeys] = useState<string[]>(['0-0']);
    const [expandedImageKeys, setExpandedImageKeys] = useState<string[]>([]);

    // --- Helper to extract section-level errors ---
    const getSectionErrors = (secIdx: number) => {
        if (!errors || Object.keys(errors).length === 0) return [];
        const prefix = `sections.${secIdx}.`;
        return Object.entries(errors)
            .filter(([key]) => key.startsWith(prefix) && !key.startsWith(`sections.${secIdx}.questions.`))
            .map(([key, message]) => ({
                key,
                field: key.replace(prefix, ''),
                message,
            }));
    };

    // --- Helper to extract all errors for a specific question ---
    const getQuestionErrors = (secIdx: number, qIdx: number) => {
        if (!errors || Object.keys(errors).length === 0) return [];
        const prefix = `sections.${secIdx}.questions.${qIdx}.`;
        const legacyPrefix = `questions.${qIdx}.`;
        return Object.entries(errors)
            .filter(([key]) => key.startsWith(prefix) || key.startsWith(legacyPrefix) || key === `sections.${secIdx}.questions.${qIdx}` || key === `questions.${qIdx}`)
            .map(([key, message]) => {
                let field = '';
                if (key.startsWith(prefix)) {
                    field = key.replace(prefix, '');
                } else if (key.startsWith(legacyPrefix)) {
                    field = key.replace(legacyPrefix, '');
                } else {
                    field = 'general';
                }
                return { key, field, message };
            });
    };

    // --- Helper to get error message for a specific question field ---
    const getQuestionFieldError = (secIdx: number, qIdx: number, field: string): string | undefined => {
        if (!errors || Object.keys(errors).length === 0) return undefined;
        const directKey = `sections.${secIdx}.questions.${qIdx}.${field}`;
        if (errors[directKey]) return errors[directKey];
        const legacyKey = `questions.${qIdx}.${field}`;
        if (errors[legacyKey]) return errors[legacyKey];

        const prefix = `sections.${secIdx}.questions.${qIdx}.${field}.`;
        const found = Object.entries(errors).find(([k]) => k.startsWith(prefix));
        if (found) return found[1];
        return undefined;
    };

    // --- Auto-expand sections & questions containing validation errors and smooth scroll ---
    useEffect(() => {
        if (!errors || Object.keys(errors).length === 0) return;

        const sectionsToExpand = new Set<number>(expandedSectionIndexes);
        const questionsToExpand = new Set<string>(expandedQuestionKeys);
        let firstErrorElementId: string | null = null;

        sections.forEach((sec, sIdx) => {
            const secErrors = getSectionErrors(sIdx);
            let sectionHasError = secErrors.length > 0;

            (sec.questions || []).forEach((_, qIdx) => {
                const qErrors = getQuestionErrors(sIdx, qIdx);
                if (qErrors.length > 0) {
                    sectionHasError = true;
                    const qKey = `${sIdx}-${qIdx}`;
                    questionsToExpand.add(qKey);
                    if (!firstErrorElementId) {
                        firstErrorElementId = `question-card-${sIdx}-${qIdx}`;
                    }
                }
            });

            if (sectionHasError) {
                sectionsToExpand.add(sIdx);
                if (!firstErrorElementId && secErrors.length > 0) {
                    firstErrorElementId = `section_block_${sec.tempId || sec.id || sIdx}`;
                }
            }
        });

        setExpandedSectionIndexes(Array.from(sectionsToExpand));
        setExpandedQuestionKeys(Array.from(questionsToExpand));

        if (firstErrorElementId) {
            setTimeout(() => {
                const el = document.getElementById(firstErrorElementId!);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 200);
        }
    }, [errors]);

    // Calculate total questions and total score across all sections
    const totalQuestionsCount = sections.reduce((sum, sec) => sum + (sec.questions?.length || 0), 0);
    const totalScore = sections.reduce(
        (sum, sec) => sum + (sec.questions || []).reduce((qSum, q) => qSum + (Number(q.score) || 0), 0),
        0,
    );

    // --- Section Management ---
    const handleOpenAddSectionModal = () => {
        const nextNum = sections.length + 1;
        setNewSectionSkill(SKILL_READING);
        setNewSectionTitle(`Phần ${nextNum}: Đọc hiểu (Reading)`);
        setNewSectionDescription('');
        setIsAddSectionModalOpen(true);
    };

    const handleConfirmAddSection = (e?: React.FormEvent | React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!newSectionTitle.trim()) {
            return;
        }

        const nextIndex = sections.length;
        const tempId = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newSection: ExamSectionData = {
            tempId,
            title: newSectionTitle.trim() || `Phần ${nextIndex + 1}`,
            description: newSectionDescription.trim() || null,
            skill: newSectionSkill,
            order_index: nextIndex,
            questions: [],
        };

        const updated = [...sections, newSection];
        onChangeSections(updated);
        setExpandedSectionIndexes((prev) => [...prev, nextIndex]);
        setIsAddSectionModalOpen(false);

        // Scroll gently to the newly created section
        setTimeout(() => {
            const el = document.getElementById(`section_block_${tempId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 150);
    };

    const handleUpdateSection = (sectionIndex: number, fields: Partial<ExamSectionData>) => {
        const updated = [...sections];
        updated[sectionIndex] = { ...updated[sectionIndex], ...fields };
        onChangeSections(updated);
    };

    const handleDeleteSection = (sectionIndex: number) => {
        const sec = sections[sectionIndex];
        const count = sec.questions?.length || 0;
        const messageText = count > 0
            ? `Bạn có chắc muốn xóa "${sec.title || `Phần ${sectionIndex + 1}`}" cùng toàn bộ ${count} câu hỏi bên trong không?`
            : `Bạn có chắc muốn xóa "${sec.title || `Phần ${sectionIndex + 1}`}" không?`;

        setConfirmDialog({
            isOpen: true,
            title: 'Xác nhận xóa phần thi',
            message: messageText,
            type: 'danger',
            confirmText: 'Xóa phần thi',
            onConfirm: () => {
                const updated = sections.filter((_, idx) => idx !== sectionIndex);
                onChangeSections(updated);
                setExpandedSectionIndexes(
                    expandedSectionIndexes
                        .filter((idx) => idx !== sectionIndex)
                        .map((idx) => (idx > sectionIndex ? idx - 1 : idx)),
                );
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    const handleMoveSection = (fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= sections.length) return;
        const updated = [...sections];
        const [moved] = updated.splice(fromIdx, 1);
        updated.splice(toIdx, 0, moved);
        onChangeSections(updated);
    };

    const toggleExpandSection = (sectionIndex: number) => {
        if (expandedSectionIndexes.includes(sectionIndex)) {
            setExpandedSectionIndexes(expandedSectionIndexes.filter((idx) => idx !== sectionIndex));
        } else {
            setExpandedSectionIndexes([...expandedSectionIndexes, sectionIndex]);
        }
    };

    // --- Question Management inside a Section ---
    const getQuestionKey = (sectionIdx: number, qIdx: number) => `${sectionIdx}-${qIdx}`;

    const toggleExpandQuestion = (sectionIdx: number, qIdx: number) => {
        const key = getQuestionKey(sectionIdx, qIdx);
        if (expandedQuestionKeys.includes(key)) {
            setExpandedQuestionKeys(expandedQuestionKeys.filter((k) => k !== key));
        } else {
            setExpandedQuestionKeys([...expandedQuestionKeys, key]);
        }
    };

    const toggleImageAttachment = (sectionIdx: number, qIdx: number) => {
        const key = getQuestionKey(sectionIdx, qIdx);
        if (expandedImageKeys.includes(key)) {
            setExpandedImageKeys(expandedImageKeys.filter((k) => k !== key));
        } else {
            setExpandedImageKeys([...expandedImageKeys, key]);
        }
    };

    const handleOpenAddQuestionModal = (sectionIdx: number) => {
        setActiveQuestionModalSectionIdx(sectionIdx);
    };

    const handleSelectQuestionType = (type: QuestionType) => {
        if (activeQuestionModalSectionIdx === null) return;
        const sectionIdx = activeQuestionModalSectionIdx;
        const section = sections[sectionIdx];
        const currentQuestions = section.questions || [];
        const nextLocalIdx = currentQuestions.length;

        // Calculate global question number
        let globalNum = 1;
        for (let i = 0; i < sectionIdx; i++) {
            globalNum += (sections[i].questions?.length || 0);
        }
        globalNum += nextLocalIdx;

        const newQuestion: ExamQuestionData = {
            code: `Q${String(globalNum).padStart(9, '0')}`,
            title: '',
            skill: section.skill,
            question_type: type,
            content: '',
            score: 1.00,
            image_url: null,
            audio_url: section.skill === SKILL_LISTENING ? '' : null,
            options: getDefaultOptions(type),
            correct_answer: getDefaultCorrectAnswer(type),
            explanation: '',
            metadata: getDefaultMetadata(type),
            order_index: nextLocalIdx,
        };

        const updatedQuestions = [...currentQuestions, newQuestion];
        handleUpdateSection(sectionIdx, { questions: updatedQuestions });

        setExpandedQuestionKeys([...expandedQuestionKeys, getQuestionKey(sectionIdx, nextLocalIdx)]);
        setActiveQuestionModalSectionIdx(null);
    };

    const handleUpdateQuestion = (
        sectionIdx: number,
        qIdx: number,
        updatedFields: Partial<ExamQuestionData>,
    ) => {
        const section = sections[sectionIdx];
        const updatedQuestions = [...(section.questions || [])];
        updatedQuestions[qIdx] = { ...updatedQuestions[qIdx], ...updatedFields };
        handleUpdateSection(sectionIdx, { questions: updatedQuestions });
    };

    const handleDuplicateQuestion = (sectionIdx: number, qIdx: number) => {
        const section = sections[sectionIdx];
        const currentQuestions = section.questions || [];
        const target = currentQuestions[qIdx];
        const clone: ExamQuestionData = {
            ...JSON.parse(JSON.stringify(target)),
            id: undefined,
            code: `Q${String(totalQuestionsCount + 1).padStart(9, '0')}`,
            order_index: currentQuestions.length,
        };
        const updatedQuestions = [...currentQuestions, clone];
        handleUpdateSection(sectionIdx, { questions: updatedQuestions });
        setExpandedQuestionKeys([...expandedQuestionKeys, getQuestionKey(sectionIdx, currentQuestions.length)]);
    };

    const handleDeleteQuestion = (sectionIdx: number, qIdx: number) => {
        const q = (sections[sectionIdx]?.questions || [])[qIdx];
        setConfirmDialog({
            isOpen: true,
            title: 'Xác nhận xóa câu hỏi',
            message: `Bạn có chắc muốn xóa câu hỏi số ${qIdx + 1} (${q?.code || `Q${qIdx + 1}`}) này không?`,
            type: 'danger',
            confirmText: 'Xóa câu hỏi',
            onConfirm: () => {
                const section = sections[sectionIdx];
                const updatedQuestions = (section.questions || []).filter((_, idx) => idx !== qIdx);
                handleUpdateSection(sectionIdx, { questions: updatedQuestions });
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    const handleMoveQuestion = (sectionIdx: number, fromIdx: number, toIdx: number) => {
        const section = sections[sectionIdx];
        const questionsList = [...(section.questions || [])];
        if (toIdx < 0 || toIdx >= questionsList.length) return;
        const [moved] = questionsList.splice(fromIdx, 1);
        questionsList.splice(toIdx, 0, moved);
        handleUpdateSection(sectionIdx, { questions: questionsList });
    };

    const handleInsertBlankTag = (sectionIdx: number, questionIndex: number) => {
        const section = sections[sectionIdx];
        const q = (section.questions || [])[questionIndex];
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

        handleUpdateQuestion(sectionIdx, questionIndex, {
            content: newContent,
            correct_answer: currentAns,
        });
    };

    // --- Defaults & Helpers ---
    const getDefaultOptions = (type: QuestionType) => {
        switch (type) {
            case QUESTION_TYPE_SINGLE_CHOICE:
                return [
                    { id: 'A', text: '' },
                    { id: 'B', text: '' },
                    { id: 'C', text: '' },
                    { id: 'D', text: '' },
                ];
            case QUESTION_TYPE_MULTIPLE_CHOICE:
                return [
                    { id: 'A', text: '' },
                    { id: 'B', text: '' },
                    { id: 'C', text: '' },
                    { id: 'D', text: '' },
                    { id: 'E', text: '' },
                ];
            case QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN:
                return [
                    { id: 'TRUE', label: 'TRUE' },
                    { id: 'FALSE', label: 'FALSE' },
                    { id: 'NOT_GIVEN', label: 'NOT GIVEN (Không có thông tin)' },
                ];
            case QUESTION_TYPE_DRAG_DROP_CLOZE:
                return {
                    words: [
                        { id: 'w1', text: 'destination' },
                        { id: 'w2', text: 'islands' },
                        { id: 'w3', text: 'mountain' },
                    ],
                };
            case QUESTION_TYPE_MATCHING:
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
            case QUESTION_TYPE_MATCHING_IMAGE:
                return {
                    sentences: [
                        { id: 'S1', text: 'The cat is sleeping under the tree.' },
                        { id: 'S2', text: 'A boy is riding a bicycle in the park.' },
                        { id: 'S3', text: 'They are having a picnic near the lake.' },
                    ],
                    images: [
                        { id: 'IMG_A', image_url: '', label: 'Hình A' },
                        { id: 'IMG_B', image_url: '', label: 'Hình B' },
                        { id: 'IMG_C', image_url: '', label: 'Hình C' },
                        { id: 'IMG_D', image_url: '', label: 'Hình D (tùy chọn thừa)' },
                    ],
                };
            case QUESTION_TYPE_MATCHING_SENTENCES:
                return {
                    left_items: [
                        { id: 'L1', label: '1. Although it was raining heavily,' },
                        { id: 'L2', label: '2. Because he studied very hard,' },
                        { id: 'L3', label: '3. If you practice English every day,' },
                    ],
                    right_items: [
                        { id: 'R1', text: 'A. they still decided to go camping.' },
                        { id: 'R2', text: 'B. he passed the final exam with high scores.' },
                        { id: 'R3', text: 'C. your speaking skills will improve quickly.' },
                        { id: 'R4', text: 'D. she didn\'t attend the meeting.' },
                    ],
                };
            case QUESTION_TYPE_ORDERING:
                return [
                    { id: 't1', text: 'Cụm từ 1' },
                    { id: 't2', text: 'Cụm từ 2' },
                    { id: 't3', text: 'Cụm từ 3' },
                ];
            case QUESTION_TYPE_DIAGRAM_LABELLING:
                return {
                    labels: [
                        { id: 'loc_1', text: 'Vị trí 1' },
                        { id: 'loc_2', text: 'Vị trí 2' },
                    ],
                    map_pins: ['A', 'B', 'C', 'D'],
                };
            case QUESTION_TYPE_FIND_MISTAKE:
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
            case QUESTION_TYPE_SINGLE_CHOICE:
                return 'A';
            case QUESTION_TYPE_MULTIPLE_CHOICE:
                return ['A', 'B'];
            case QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN:
                return 'TRUE';
            case QUESTION_TYPE_FILL_IN_BLANK:
                return {
                    blank_1: { accepted_answers: [''], case_sensitive: false },
                };
            case QUESTION_TYPE_DRAG_DROP_CLOZE:
                return {
                    blank_1: 'w1',
                };
            case QUESTION_TYPE_MATCHING:
                return { L1: 'R1', L2: 'R2', L3: 'R3' };
            case QUESTION_TYPE_MATCHING_IMAGE:
                return { S1: 'IMG_A', S2: 'IMG_B', S3: 'IMG_C' };
            case QUESTION_TYPE_MATCHING_SENTENCES:
                return { L1: 'R1', L2: 'R2', L3: 'R3' };
            case QUESTION_TYPE_ORDERING:
                return ['t1', 't2', 't3'];
            case QUESTION_TYPE_DIAGRAM_LABELLING:
                return { loc_1: 'A', loc_2: 'B' };
            case QUESTION_TYPE_FIND_MISTAKE:
                return 'A';
            default:
                return null;
        }
    };

    const getDefaultMetadata = (type: QuestionType) => {
        switch (type) {
            case QUESTION_TYPE_MULTIPLE_CHOICE:
                return { max_select: 2 };
            case QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN:
                return { variant: 'T_F_NG' };
            case QUESTION_TYPE_FILL_IN_BLANK:
                return { word_limit: '', word_bank: [] };
            case QUESTION_TYPE_ESSAY:
                return {
                    min_words: 250,
                    rubrics: [
                        { criteria: 'Task Achievement', max_score: 2.5 },
                        { criteria: 'Coherence & Cohesion', max_score: 2.5 },
                        { criteria: 'Lexical Resource', max_score: 2.5 },
                        { criteria: 'Grammatical Range', max_score: 2.5 },
                    ],
                };
            case QUESTION_TYPE_AUDIO_RECORD:
                return { prep_time_seconds: 60, max_record_duration_seconds: 120 };
            default:
                return {};
        }
    };

    const getTypeIcon = (type: QuestionType) => {
        switch (type) {
            case QUESTION_TYPE_SINGLE_CHOICE:
                return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
            case QUESTION_TYPE_MULTIPLE_CHOICE:
                return <ListChecks className="h-4 w-4 text-indigo-600" />;
            case QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN:
                return <HelpCircle className="h-4 w-4 text-emerald-600" />;
            case QUESTION_TYPE_FILL_IN_BLANK:
                return <FileText className="h-4 w-4 text-amber-600" />;
            case QUESTION_TYPE_MATCHING:
                return <GitMerge className="h-4 w-4 text-purple-600" />;
            case QUESTION_TYPE_MATCHING_IMAGE:
                return <ImageIcon className="h-4 w-4 text-teal-600" />;
            case QUESTION_TYPE_MATCHING_SENTENCES:
                return <GitMerge className="h-4 w-4 text-violet-600" />;
            case QUESTION_TYPE_ORDERING:
                return <ArrowUpDown className="h-4 w-4 text-cyan-600" />;
            case QUESTION_TYPE_DIAGRAM_LABELLING:
                return <MapPin className="h-4 w-4 text-teal-600" />;
            case QUESTION_TYPE_FIND_MISTAKE:
                return <AlertTriangle className="h-4 w-4 text-rose-600" />;
            case QUESTION_TYPE_ESSAY:
                return <PenTool className="h-4 w-4 text-orange-600" />;
            case QUESTION_TYPE_AUDIO_RECORD:
                return <Mic className="h-4 w-4 text-pink-600" />;
            default:
                return <HelpCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getSkillConfig = (skill: ExamSkill) => {
        switch (skill) {
            case SKILL_LISTENING:
                return {
                    headerBg: 'bg-blue-600',
                    border: 'border-blue-300',
                    badge: 'bg-blue-700 text-white',
                    addBtn: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
                    dot: 'bg-blue-500',
                    icon: <Headphones className="h-4 w-4 text-white" />,
                    name: 'Nghe (Listening)',
                };
            case SKILL_WRITING:
                return {
                    headerBg: 'bg-amber-500',
                    border: 'border-amber-300',
                    badge: 'bg-amber-600 text-white',
                    addBtn: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
                    dot: 'bg-amber-500',
                    icon: <PenTool className="h-4 w-4 text-white" />,
                    name: 'Viết (Writing)',
                };
            case SKILL_SPEAKING:
                return {
                    headerBg: 'bg-pink-500',
                    border: 'border-pink-300',
                    badge: 'bg-pink-600 text-white',
                    addBtn: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200',
                    dot: 'bg-pink-500',
                    icon: <Mic className="h-4 w-4 text-white" />,
                    name: 'Nói (Speaking)',
                };
            case SKILL_READING:
            default:
                return {
                    headerBg: 'bg-emerald-600',
                    border: 'border-emerald-300',
                    badge: 'bg-emerald-700 text-white',
                    addBtn: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
                    dot: 'bg-emerald-500',
                    icon: <BookOpen className="h-4 w-4 text-white" />,
                    name: 'Đọc (Reading)',
                };
        }
    };

    const activeModalSkill = activeQuestionModalSectionIdx !== null
        ? sections[activeQuestionModalSectionIdx]?.skill ?? SKILL_READING
        : SKILL_READING;

    const compatibleQuestionTypes = QUESTION_TYPES.filter((t) => t.skills.includes(activeModalSkill));

    return (
        <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8 space-y-6">
            {/* Header & Overall KPI */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
                <div>
                    <h2 className="flex items-center gap-2.5 text-xl font-bold text-gray-900">
                        <Sparkles className="h-6 w-6 text-emerald-600" />
                        2. Soạn Thảo Đề Thi (Theo Từng Phần Thi Động)
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                        Thêm các phần thi (Sections) linh hoạt theo thứ tự bất kỳ (Đọc, Nghe, Viết, Nói) với tiêu đề và mô tả riêng.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Score Counter Badge */}
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200">
                        <span className="text-xs text-gray-500">Tổng điểm:</span>
                        <span
                            className={`font-mono text-sm font-extrabold ${Number(totalScore) === Number(examMaxScore)
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                                }`}
                        >
                            {totalScore} / {examMaxScore} điểm
                        </span>
                        <span className="text-2xs text-gray-400">({totalQuestionsCount} câu)</span>
                    </div>

                    <Button
                        type="button"
                        variant="success"
                        size="md"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={handleOpenAddSectionModal}
                    >
                        Thêm Phần Thi
                    </Button>
                </div>
            </div>

            {/* Sections List */}
            {sections.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center bg-gray-50/50">
                    <Layers className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-3 text-sm font-bold text-gray-800">Chưa có phần thi nào trong đề thi này</p>
                    <p className="mt-1 text-xs text-gray-400 max-w-md mx-auto">
                        Bấm nút bên dưới để thêm Phần thi đầu tiên (ví dụ: Phần 1: Đọc hiểu, Phần 2: Nghe...).
                    </p>
                    <div className="mt-5">
                        <Button
                            type="button"
                            variant="success"
                            size="md"
                            icon={<Plus className="h-4 w-4" />}
                            onClick={handleOpenAddSectionModal}
                        >
                            + Thêm Phần Thi Đầu Tiên
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {sections.map((section, secIdx) => {
                        const isSecExpanded = expandedSectionIndexes.includes(secIdx);
                        const secConfig = getSkillConfig(section.skill);
                        const secQuestions = section.questions || [];
                        const secScore = secQuestions.reduce((s, q) => s + (Number(q.score) || 0), 0);
                        const secErrors = getSectionErrors(secIdx);
                        const secHasErrors = secErrors.length > 0 || secQuestions.some((_, qIdx) => getQuestionErrors(secIdx, qIdx).length > 0);
                        const secTitleError = secErrors.find((e) => e.field === 'title')?.message;

                        return (
                            <div
                                key={section.tempId || section.id || secIdx}
                                id={`section_block_${section.tempId || section.id || secIdx}`}
                                className={`rounded-2xl border-2 ${secHasErrors ? 'border-red-500 ring-2 ring-red-500/20' : secConfig.border} overflow-hidden shadow-xs scroll-mt-6`}
                            >
                                {/* ── Section Header Bar ── */}
                                <div
                                    className={`${secConfig.headerBg} px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none cursor-pointer`}
                                    onClick={() => toggleExpandSection(secIdx)}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpandSection(secIdx);
                                            }}
                                            className="text-white hover:bg-white/20 p-1 rounded-md transition-colors"
                                        >
                                            {isSecExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            {secConfig.icon}
                                            <span className="text-sm font-extrabold text-white tracking-wide">
                                                {section.title || `Phần ${secIdx + 1}`}
                                            </span>
                                        </div>
                                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${secConfig.badge}`}>
                                            {secConfig.name} • {secQuestions.length} câu • {secScore} điểm
                                        </span>
                                        {secHasErrors && (
                                            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white shadow-2xs">
                                                <AlertCircle className="h-3 w-3 text-white" />
                                                Có lỗi trong phần này
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                        {/* Reorder Section Buttons */}
                                        <button
                                            type="button"
                                            disabled={secIdx === 0}
                                            onClick={() => handleMoveSection(secIdx, secIdx - 1)}
                                            className="rounded-md p-1.5 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                                            title="Di chuyển phần thi lên trên"
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={secIdx === sections.length - 1}
                                            onClick={() => handleMoveSection(secIdx, secIdx + 1)}
                                            className="rounded-md p-1.5 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                                            title="Di chuyển phần thi xuống dưới"
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </button>

                                        {/* Add Question Button on Header */}
                                        <button
                                            type="button"
                                            onClick={() => handleOpenAddQuestionModal(secIdx)}
                                            className="flex items-center gap-1 rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-2xs font-bold text-white transition-colors ml-1"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Thêm câu hỏi
                                        </button>

                                        {/* Delete Section */}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteSection(secIdx)}
                                            className="rounded-md p-1.5 text-white/70 hover:bg-red-600 hover:text-white transition-colors"
                                            title="Xóa phần thi này"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* ── Section Body ── */}
                                {isSecExpanded && (
                                    <div className="bg-slate-50/60 p-4 space-y-4 border-t border-gray-100">
                                        {/* Section Metadata: Editable Title & Description */}
                                        <div className={`bg-white p-4 rounded-xl border shadow-2xs space-y-3 ${secTitleError ? 'border-red-400 bg-red-50/10' : 'border-gray-200'}`}>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="sm:col-span-2">
                                                    <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1">
                                                        <Edit3 className="h-3 w-3 text-emerald-600" />
                                                        Tiêu Đề Phần Thi (*)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={section.title}
                                                        onChange={(e) => handleUpdateSection(secIdx, { title: e.target.value })}
                                                        placeholder="VD: Phần 1: Đọc hiểu văn bản / Reading Passage 1..."
                                                        className={`w-full rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-hidden ${
                                                            secTitleError
                                                                ? 'border-2 border-red-500 bg-red-50/20 focus:border-red-500 ring-1 ring-red-500'
                                                                : 'border border-gray-300 bg-white focus:border-emerald-500'
                                                        }`}
                                                    />
                                                    {secTitleError && (
                                                        <p className="mt-1 text-xs text-red-600 font-semibold">{secTitleError}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-700">
                                                        Kỹ Năng Phần Thi:
                                                    </label>
                                                    <div className="flex items-center gap-2 pt-0.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${section.skill === SKILL_LISTENING ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                            section.skill === SKILL_WRITING ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                                section.skill === SKILL_SPEAKING ? 'bg-pink-100 text-pink-800 border border-pink-200' :
                                                                    'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                            }`}>
                                                            {secConfig.icon}
                                                            {secConfig.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1">
                                                    <AlignLeft className="h-3 w-3 text-gray-500" />
                                                    Mô Tả / Đoạn Văn Bản Hướng Dẫn Chung Cho Phần Này
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={section.description || ''}
                                                    onChange={(e) => handleUpdateSection(secIdx, { description: e.target.value || null })}
                                                    placeholder="VD: Đọc đoạn văn sau và trả lời các câu hỏi từ 1 đến 5 bằng cách chọn đáp án đúng..."
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-emerald-500 focus:outline-hidden"
                                                />
                                            </div>
                                        </div>

                                        {/* Questions in Section */}
                                        {secQuestions.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center bg-white">
                                                <p className="text-xs font-semibold text-gray-500">
                                                    Phần này chưa có câu hỏi nào.
                                                </p>
                                                <div className="mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenAddQuestionModal(secIdx)}
                                                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${secConfig.addBtn}`}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Thêm câu hỏi cho {section.title || `Phần ${secIdx + 1}`}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {secQuestions.map((q, qIndex) => {
                                                    const qKey = getQuestionKey(secIdx, qIndex);
                                                    const isExpanded = expandedQuestionKeys.includes(qKey);
                                                    const normalizedType: QuestionType = q.question_type || QUESTION_TYPE_SINGLE_CHOICE;
                                                    const typeInfo = QUESTION_TYPES.find((t) => t.type === normalizedType) || QUESTION_TYPES[0];
                                                    const isListening = section.skill === SKILL_LISTENING;

                                                    const qErrors = getQuestionErrors(secIdx, qIndex);
                                                    const hasQError = qErrors.length > 0;
                                                    const qTitleError = getQuestionFieldError(secIdx, qIndex, 'title');
                                                    const qContentError = getQuestionFieldError(secIdx, qIndex, 'content');
                                                    const qScoreError = getQuestionFieldError(secIdx, qIndex, 'score');
                                                    const qAudioError = getQuestionFieldError(secIdx, qIndex, 'audio_url');
                                                    const qAnswerError = getQuestionFieldError(secIdx, qIndex, 'correct_answer');
                                                    const qOptionsError = getQuestionFieldError(secIdx, qIndex, 'options');
                                                    const hasAnswerError = Boolean(qAnswerError || qOptionsError);

                                                    return (
                                                        <div
                                                            key={qKey}
                                                            id={`question-card-${secIdx}-${qIndex}`}
                                                            className={`rounded-xl border-2 overflow-hidden transition-all duration-150 scroll-mt-6 ${
                                                                hasQError
                                                                    ? 'border-red-500 bg-red-50/15 shadow-sm ring-2 ring-red-500/20'
                                                                    : isExpanded
                                                                        ? 'border-gray-300 shadow-sm ring-1 ring-emerald-400/20 bg-white'
                                                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-xs bg-white'
                                                            }`}
                                                        >
                                                            {/* Question Row Header */}
                                                            <div
                                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none"
                                                                onClick={() => toggleExpandQuestion(secIdx, qIndex)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${hasQError ? 'bg-red-600' : secConfig.dot} font-mono text-2xs font-extrabold text-white`}>
                                                                            {qIndex + 1}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold border ${typeInfo.badgeColor}`}>
                                                                            {getTypeIcon(normalizedType)}
                                                                            {typeInfo.label}
                                                                        </span>
                                                                        <span className="text-xs text-gray-400 font-mono">
                                                                            {q.code || `Q${qIndex + 1}`}
                                                                        </span>
                                                                        {q.content && (
                                                                            <span className="hidden sm:inline text-xs text-gray-500 truncate max-w-xs">
                                                                                — {q.content}
                                                                            </span>
                                                                        )}
                                                                        {hasQError && (
                                                                            <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                                                                                <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                                                                Có lỗi ({qErrors.length})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                                                    {/* Score */}
                                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${
                                                                        qScoreError
                                                                            ? 'border-red-500 bg-red-50 text-red-700 font-bold ring-1 ring-red-500/30'
                                                                            : 'border-gray-200 bg-white'
                                                                    }`}>
                                                                        <span className={qScoreError ? 'text-red-700 font-bold' : 'text-gray-500'}>Điểm:</span>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min={0}
                                                                            value={q.score}
                                                                            onChange={(e) => handleUpdateQuestion(secIdx, qIndex, { score: Number(e.target.value) })}
                                                                            className={`w-12 text-center font-bold border-none p-0 focus:ring-0 text-xs ${
                                                                                qScoreError ? 'text-red-700 bg-transparent' : 'text-gray-900 bg-white'
                                                                            }`}
                                                                            title="Điểm số câu hỏi"
                                                                        />
                                                                    </div>

                                                                    {/* Reorder */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={qIndex === 0}
                                                                        onClick={() => handleMoveQuestion(secIdx, qIndex, qIndex - 1)}
                                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                                                                        title="Di chuyển lên"
                                                                    >
                                                                        <ChevronUp className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={qIndex === secQuestions.length - 1}
                                                                        onClick={() => handleMoveQuestion(secIdx, qIndex, qIndex + 1)}
                                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
                                                                        title="Di chuyển xuống"
                                                                    >
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    </button>

                                                                    {/* Duplicate */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDuplicateQuestion(secIdx, qIndex)}
                                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                                                        title="Nhân bản câu hỏi"
                                                                    >
                                                                        <Copy className="h-4 w-4" />
                                                                    </button>

                                                                    {/* Delete */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteQuestion(secIdx, qIndex)}
                                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                                        title="Xóa câu hỏi"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>

                                                                    {/* Expand Toggle */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleExpandQuestion(secIdx, qIndex)}
                                                                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                                                                    >
                                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Expanded Question Editor */}
                                                            {isExpanded && (
                                                                <div className="border-t border-gray-200 p-5 space-y-5 bg-white">
                                                                    {/* Question Error Callout Banner */}
                                                                    {hasQError && (
                                                                        <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-800 space-y-1.5 shadow-2xs">
                                                                            <div className="font-bold flex items-center gap-1.5 text-red-900">
                                                                                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                                                                                <span>Vui lòng kiểm tra và sửa thông tin bị lỗi trong câu hỏi này:</span>
                                                                            </div>
                                                                            <ul className="list-disc list-inside space-y-0.5 text-red-700 pl-1 font-medium">
                                                                                {qErrors.map((err, errIdx) => (
                                                                                    <li key={errIdx}>{err.message}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}

                                                                    {/* Question Type Selector */}
                                                                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-bold text-gray-700">Kiểu Mẫu Câu:</span>
                                                                            <select
                                                                                value={normalizedType}
                                                                                onChange={(e) => {
                                                                                    const newType = Number(e.target.value) as QuestionType;
                                                                                    handleUpdateQuestion(secIdx, qIndex, {
                                                                                        question_type: newType,
                                                                                        options: getDefaultOptions(newType),
                                                                                        correct_answer: getDefaultCorrectAnswer(newType),
                                                                                        metadata: getDefaultMetadata(newType),
                                                                                    });
                                                                                }}
                                                                                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-bold text-gray-800 shadow-2xs"
                                                                            >
                                                                                {QUESTION_TYPES.filter((t) => t.skills.includes(section.skill)).map((t) => (
                                                                                    <option key={t.type} value={t.type}>
                                                                                        {t.label}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    {/* Audio Section: ONLY FOR LISTENING */}
                                                                    {isListening && (
                                                                        <div className={qAudioError ? 'p-2.5 rounded-xl border-2 border-red-500 bg-red-50/20' : ''}>
                                                                            <MediaUploader
                                                                                value={q.audio_url || ''}
                                                                                onChange={(url) => handleUpdateQuestion(secIdx, qIndex, { audio_url: url || null })}
                                                                                accept="audio/*"
                                                                                label="File Audio Nghe (Listening Track MP3) (*)"
                                                                                placeholder="Dán đường dẫn URL file audio hoặc chọn tải lên từ máy..."
                                                                                folder="exams/audio"
                                                                            />
                                                                            {qAudioError && (
                                                                                <p className="mt-1.5 text-xs text-red-600 font-semibold">{qAudioError}</p>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Question Title */}
                                                                    <div>
                                                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-800 block mb-1.5">
                                                                            Tiêu Đề Câu Hỏi (Tùy chọn)
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={q.title || ''}
                                                                            onChange={(e) => handleUpdateQuestion(secIdx, qIndex, { title: e.target.value || null })}
                                                                            placeholder="VD: Questions 1-5, Section 1, Part 2..."
                                                                            className={`w-full rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-hidden ${
                                                                                qTitleError
                                                                                    ? 'border-2 border-red-500 bg-red-50/20 focus:border-red-500 ring-1 ring-red-500'
                                                                                    : 'border border-gray-300 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                                                                            }`}
                                                                        />
                                                                        {qTitleError && (
                                                                            <p className="mt-1 text-xs text-red-600 font-semibold">{qTitleError}</p>
                                                                        )}
                                                                    </div>

                                                                    {/* Question Content */}
                                                                    <div>
                                                                        <div className="flex items-center justify-between mb-1.5">
                                                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-800">
                                                                                Nội Dung Câu Hỏi / Đề Bài (*)
                                                                            </label>
                                                                            {normalizedType !== QUESTION_TYPE_DIAGRAM_LABELLING && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleImageAttachment(secIdx, qIndex)}
                                                                                    className="text-2xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                                                                                >
                                                                                    <ImageIcon className="h-3 w-3 text-emerald-600" />
                                                                                    <span>
                                                                                        {q.image_url || expandedImageKeys.includes(qKey) ? 'Đóng ảnh đính kèm' : '+ Đính kèm ảnh đề bài'}
                                                                                    </span>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <textarea
                                                                            rows={3}
                                                                            value={q.content}
                                                                            onChange={(e) => handleUpdateQuestion(secIdx, qIndex, { content: e.target.value })}
                                                                            placeholder="Nhập nội dung câu hỏi hoặc yêu cầu làm bài..."
                                                                            className={`w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-hidden ${
                                                                                qContentError
                                                                                    ? 'border-2 border-red-500 bg-red-50/20 focus:border-red-500 ring-1 ring-red-500'
                                                                                    : 'border border-gray-300 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                                                                            }`}
                                                                            required
                                                                        />
                                                                        {qContentError && (
                                                                            <p className="mt-1 text-xs text-red-600 font-semibold">{qContentError}</p>
                                                                        )}
                                                                    </div>

                                                                    {/* Image Attachment */}
                                                                    {normalizedType !== QUESTION_TYPE_DIAGRAM_LABELLING && (q.image_url || expandedImageKeys.includes(qKey)) && (
                                                                        <div className="space-y-2">
                                                                            <MediaUploader
                                                                                value={q.image_url}
                                                                                onChange={(url) => handleUpdateQuestion(secIdx, qIndex, { image_url: url || null })}
                                                                                objectType="question"
                                                                                objectId={q.code || `Q${secIdx + 1}_${qIndex + 1}`}
                                                                                label="Hình Ảnh Đính Kèm Đề Bài"
                                                                                placeholder="Dán URL ảnh hoặc tải ảnh từ máy tính..."
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* Type Specific Editor */}
                                                                    <div className={`rounded-xl p-4 transition-all ${
                                                                        hasAnswerError
                                                                            ? 'bg-red-50/30 border-2 border-red-400 ring-2 ring-red-400/20'
                                                                            : 'bg-slate-50/70 border border-slate-200'
                                                                    }`}>
                                                                        {hasAnswerError && (
                                                                            <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100/80 px-3 py-2 rounded-lg border border-red-200">
                                                                                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                                                                                <span>{qAnswerError || qOptionsError || 'Vui lòng kiểm tra phương án và đáp án đúng cho câu hỏi này.'}</span>
                                                                            </div>
                                                                        )}
                                                                        {normalizedType === QUESTION_TYPE_SINGLE_CHOICE && (
                                                                            <SingleChoiceEditor
                                                                                options={q.options || []}
                                                                                correctAnswer={q.correct_answer}
                                                                                onChangeOptions={(opts) => handleUpdateQuestion(secIdx, qIndex, { options: opts })}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_MULTIPLE_CHOICE && (
                                                                            <MultipleChoiceEditor
                                                                                options={q.options || []}
                                                                                correctAnswer={q.correct_answer || []}
                                                                                metadata={q.metadata || {}}
                                                                                onChangeOptions={(opts) => handleUpdateQuestion(secIdx, qIndex, { options: opts })}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                                onChangeMetadata={(meta) => handleUpdateQuestion(secIdx, qIndex, { metadata: meta })}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN && (
                                                                            <TrueFalseEditor
                                                                                correctAnswer={q.correct_answer}
                                                                                metadata={q.metadata || {}}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                                onChangeMetadata={(meta) => handleUpdateQuestion(secIdx, qIndex, { metadata: meta })}
                                                                                onChangeOptions={(opts) => handleUpdateQuestion(secIdx, qIndex, { options: opts })}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_FILL_IN_BLANK && (
                                                                            <FillInBlankEditor
                                                                                content={q.content}
                                                                                correctAnswer={q.correct_answer || {}}
                                                                                metadata={q.metadata || {}}
                                                                                onInsertBlank={() => handleInsertBlankTag(secIdx, qIndex)}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                                onChangeMetadata={(meta) => handleUpdateQuestion(secIdx, qIndex, { metadata: meta })}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_DRAG_DROP_CLOZE && (
                                                                            <DragDropClozeEditor
                                                                                content={q.content || ''}
                                                                                options={q.options || { words: [] }}
                                                                                correctAnswer={q.correct_answer || {}}
                                                                                onInsertBlank={() => handleInsertBlankTag(secIdx, qIndex)}
                                                                                onChangeOptions={(opts) => handleUpdateQuestion(secIdx, qIndex, { options: opts })}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                                onChangeQuestion={(fields) => handleUpdateQuestion(secIdx, qIndex, fields)}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_MATCHING && (
                                                                            <MatchingEditor
                                                                                options={q.options || { left_items: [], right_items: [] }}
                                                                                correctAnswer={q.correct_answer || {}}
                                                                                onChangeOptions={(opts) => handleUpdateQuestion(secIdx, qIndex, { options: opts })}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                                onChangeQuestion={(fields) => handleUpdateQuestion(secIdx, qIndex, fields)}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_MATCHING_IMAGE && (
                                                                            <MatchingImageEditor
                                                                                options={q.options || { sentences: [], images: [] }}
                                                                                correctAnswer={q.correct_answer || {}}
                                                                                onChangeOptions={(opts) => handleUpdateQuestion(secIdx, qIndex, { options: opts })}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                                onChangeQuestion={(fields) => handleUpdateQuestion(secIdx, qIndex, fields)}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_MATCHING_SENTENCES && (
                                                                            <MatchingEditor
                                                                                options={q.options || { left_items: [], right_items: [] }}
                                                                                correctAnswer={q.correct_answer || {}}
                                                                                onChangeOptions={(opts) => handleUpdateQuestion(secIdx, qIndex, { options: opts })}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                                onChangeQuestion={(fields) => handleUpdateQuestion(secIdx, qIndex, fields)}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_ORDERING && (
                                                                            <OrderingEditor
                                                                                options={q.options || []}
                                                                                correctAnswer={q.correct_answer || []}
                                                                                onChangeOptions={(opts) => handleUpdateQuestion(secIdx, qIndex, { options: opts })}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                                onChangeQuestion={(fields) => handleUpdateQuestion(secIdx, qIndex, fields)}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_DIAGRAM_LABELLING && (
                                                                            <DiagramLabellingEditor
                                                                                imageUrl={q.image_url || ''}
                                                                                options={q.options || { labels: [], map_pins: [] }}
                                                                                correctAnswer={q.correct_answer || {}}
                                                                                onChangeImageUrl={(url) => handleUpdateQuestion(secIdx, qIndex, { image_url: url })}
                                                                                onChangeOptions={(opts) => handleUpdateQuestion(secIdx, qIndex, { options: opts })}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                                onChangeQuestion={(fields) => handleUpdateQuestion(secIdx, qIndex, fields)}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_FIND_MISTAKE && (
                                                                            <FindMistakeEditor
                                                                                options={q.options || { sentence_segments: [] }}
                                                                                correctAnswer={q.correct_answer}
                                                                                onChangeOptions={(opts) => handleUpdateQuestion(secIdx, qIndex, { options: opts })}
                                                                                onChangeCorrectAnswer={(ans) => handleUpdateQuestion(secIdx, qIndex, { correct_answer: ans })}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_ESSAY && (
                                                                            <EssayEditor
                                                                                metadata={q.metadata || {}}
                                                                                onChangeMetadata={(meta) => handleUpdateQuestion(secIdx, qIndex, { metadata: meta })}
                                                                            />
                                                                        )}

                                                                        {normalizedType === QUESTION_TYPE_AUDIO_RECORD && (
                                                                            <AudioRecordEditor
                                                                                metadata={q.metadata || {}}
                                                                                audioUrl={q.audio_url}
                                                                                onChangeMetadata={(meta) => handleUpdateQuestion(secIdx, qIndex, { metadata: meta })}
                                                                                onChangeAudioUrl={(url) => handleUpdateQuestion(secIdx, qIndex, { audio_url: url })}
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    {/* Explanation */}
                                                                    <div>
                                                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                                                                            Lời Giải Thích Chi Tiết / Hướng Dẫn Giải
                                                                        </label>
                                                                        <textarea
                                                                            rows={2}
                                                                            value={q.explanation || ''}
                                                                            onChange={(e) => handleUpdateQuestion(secIdx, qIndex, { explanation: e.target.value || null })}
                                                                            placeholder="Giải thích vì sao chọn đáp án này, trích dẫn bài đọc / đoạn nghe..."
                                                                            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Bottom Add Question for this Section */}
                                                <div className="pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenAddQuestionModal(secIdx)}
                                                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${secConfig.addBtn}`}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Thêm câu hỏi cho {section.title || `Phần ${secIdx + 1}`}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bottom Add Section Button */}
            {sections.length > 0 && (
                <div className="flex justify-center pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        icon={<Plus className="h-4 w-4 text-emerald-600" />}
                        onClick={handleOpenAddSectionModal}
                    >
                        Thêm Phần Thi Mới
                    </Button>
                </div>
            )}

            {/* --- Modal 1: Add Section Modal --- */}
            <Modal
                isOpen={isAddSectionModalOpen}
                onClose={() => setIsAddSectionModalOpen(false)}
                title="Thêm Phần Thi Mới (Section)"
                maxWidth="lg"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                            1. Chọn Kỹ Năng Của Phần Này (*)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {EXAM_SKILLS.map((sk) => {
                                const isSelected = newSectionSkill === sk.skill;
                                return (
                                    <button
                                        key={sk.skill}
                                        type="button"
                                        onClick={() => {
                                            setNewSectionSkill(sk.skill);
                                            const num = sections.length + 1;
                                            setNewSectionTitle(`Phần ${num}: ${sk.label} (${sk.englishLabel})`);
                                        }}
                                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${isSelected
                                            ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${sk.skill === SKILL_LISTENING ? 'bg-blue-100 text-blue-700' :
                                            sk.skill === SKILL_READING ? 'bg-emerald-100 text-emerald-700' :
                                                sk.skill === SKILL_WRITING ? 'bg-amber-100 text-amber-700' :
                                                    'bg-pink-100 text-pink-700'
                                            }`}>
                                            {sk.skill === SKILL_LISTENING && <Headphones className="h-4 w-4" />}
                                            {sk.skill === SKILL_READING && <BookOpen className="h-4 w-4" />}
                                            {sk.skill === SKILL_WRITING && <PenTool className="h-4 w-4" />}
                                            {sk.skill === SKILL_SPEAKING && <Mic className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">{sk.label}</p>
                                            <p className="text-3xs text-gray-500">{sk.englishLabel}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                            2. Tiêu Đề Phần Thi (*)
                        </label>
                        <input
                            type="text"
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            placeholder="VD: Phần 1: Đọc hiểu văn bản / Section 1: Listening..."
                            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                            3. Mô Tả / Hướng Dẫn Làm Bài (Tùy chọn)
                        </label>
                        <textarea
                            rows={3}
                            value={newSectionDescription}
                            onChange={(e) => setNewSectionDescription(e.target.value)}
                            placeholder="Nhập hướng dẫn làm bài, đoạn văn đọc hiểu chung hoặc ngữ cảnh phần thi..."
                            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => setIsAddSectionModalOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            variant="success"
                            size="md"
                            icon={<Plus className="h-4 w-4" />}
                            onClick={() => handleConfirmAddSection()}
                        >
                            Tạo Phần Thi
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* --- Modal 2: Add Question Modal for a Specific Section --- */}
            <Modal
                isOpen={activeQuestionModalSectionIdx !== null}
                onClose={() => setActiveQuestionModalSectionIdx(null)}
                title={`Chọn Kiểu Câu Hỏi Cho ${activeQuestionModalSectionIdx !== null
                    ? sections[activeQuestionModalSectionIdx]?.title || 'Phần thi'
                    : 'Phần thi'
                    }`}
                maxWidth="3xl"
            >
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                        Các dạng câu hỏi tương thích với kỹ năng{' '}
                        <strong className="text-gray-900">
                            {EXAM_SKILLS.find((s) => s.skill === activeModalSkill)?.label}
                        </strong>:
                    </p>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 max-h-[60vh] overflow-y-auto p-1">
                        {compatibleQuestionTypes.map((typeMeta) => (
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
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-3xs uppercase font-bold tracking-wider text-gray-400">
                                                        #{activeModalSkill}
                                                    </span>
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

            {/* --- Modal 3: Confirm Dialog Popup --- */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                confirmText={confirmDialog.confirmText}
            />
        </Card>
    );
}

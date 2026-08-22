import React from 'react';
import ChoiceRunner from './runners/ChoiceRunner';
import FillInBlankRunner from './runners/FillInBlankRunner';
import DragDropClozeQuestion from './DragDropClozeQuestion';
import MatchingAnswerForm from './MatchingAnswerForm';
import MatchingImageAnswerForm from './MatchingImageAnswerForm';
import DiagramLabellingQuestion from './DiagramLabellingQuestion';
import SortableOrderingList from './SortableOrderingList';
import FindMistakeQuestion from './FindMistakeQuestion';
import AudioRecorder from './AudioRecorder';

interface Props {
    question: any;
    value: any;
    onChange: (val: any) => void;
    classExamId?: number;
    disabled?: boolean;
}

export default function QuestionRunnerRouter({
    question,
    value,
    onChange,
    classExamId = 0,
    disabled = false,
}: Props) {
    const qType = question.question_type;

    if (
        qType === 'single_choice' ||
        qType === 'multiple_choice' ||
        qType === 'true_false_not_given'
    ) {
        return (
            <ChoiceRunner
                questionType={qType}
                options={question.options}
                value={value}
                onChange={onChange}
            />
        );
    }

    if (qType === 'fill_in_blank') {
        return (
            <FillInBlankRunner
                content={question.content || ''}
                options={question.options}
                metadata={question.metadata}
                value={value || {}}
                onChange={onChange}
            />
        );
    }

    if (qType === 'drag_drop_cloze') {
        return (
            <DragDropClozeQuestion
                content={question.content || ''}
                options={question.options}
                userAnswers={value || {}}
                onChange={onChange}
                disabled={disabled}
            />
        );
    }

    if (qType === 'matching') {
        return (
            <MatchingAnswerForm
                options={question.options}
                userAnswers={value || {}}
                onChange={onChange}
            />
        );
    }

    if (qType === 'matching_image') {
        return (
            <MatchingImageAnswerForm
                options={question.options}
                userAnswers={value || {}}
                onChange={onChange}
            />
        );
    }

    if (qType === 'diagram_labelling') {
        return (
            <DiagramLabellingQuestion
                imageUrl={question.image_url}
                options={question.options}
                value={value || {}}
                onChange={onChange}
            />
        );
    }

    if (qType === 'ordering') {
        return (
            <SortableOrderingList
                options={question.options}
                value={Array.isArray(value) ? value : []}
                onChange={onChange}
            />
        );
    }

    if (qType === 'find_mistake') {
        return (
            <FindMistakeQuestion
                content={question.content}
                options={question.options}
                value={typeof value === 'string' ? value : ''}
                onChange={onChange}
            />
        );
    }

    if (qType === 'audio_record') {
        if (classExamId) {
            return (
                <AudioRecorder
                    classExamId={classExamId}
                    questionId={question.id}
                    savedAudioPath={value}
                    onAudioUploaded={onChange}
                    disabled={disabled}
                />
            );
        }

        return (
            <div className="space-y-3 rounded-2xl bg-pink-50/60 p-4 border border-pink-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-900">
                    <span>🎙️ Phần thi Nói / Ghi âm phát âm (Speaking)</span>
                </div>
                <p className="text-xs text-pink-800 leading-relaxed">
                    Đối với chế độ thi thử (Practice Exam), bạn có thể tự luyện nói theo chủ đề trên. Khi làm bài thi chính thức trong lớp, hệ thống sẽ mở tính năng ghi âm trực tiếp qua Micro.
                </p>
                <textarea
                    rows={3}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Ghi chú dàn ý câu trả lời Speaking của bạn (tùy chọn)..."
                    className="w-full rounded-xl border border-pink-300 bg-white p-3 text-xs text-gray-900 focus:border-pink-500 focus:outline-hidden"
                />
            </div>
        );
    }

    if (qType === 'essay') {
        const text = typeof value === 'string' ? value : '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between text-2xs font-semibold text-gray-500 px-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Viết bài tự luận:
                    </label>
                    <span>
                        Số từ: <strong className="text-emerald-700">{wordCount}</strong> từ
                        {question.metadata?.min_words && ` (Tối thiểu ${question.metadata.min_words} từ)`}
                    </span>
                </div>
                <textarea
                    rows={8}
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Nhập nội dung bài làm tự luận của bạn tại đây..."
                    className="w-full rounded-2xl border border-gray-300 p-4 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
            </div>
        );
    }

    return null;
}

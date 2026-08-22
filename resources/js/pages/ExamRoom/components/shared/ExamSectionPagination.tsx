import React from 'react';
import Button from '@/components/ui/Button';

interface Props {
    currentIndex: number;
    totalCount: number;
    onPrev: () => void;
    onNext: () => void;
    labelPrefix?: string;
}

export default function ExamSectionPagination({
    currentIndex,
    totalCount,
    onPrev,
    onNext,
    labelPrefix = 'Phần',
}: Props) {
    if (totalCount <= 1) return null;

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
            <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentIndex === 0}
                onClick={onPrev}
            >
                ← {labelPrefix} Trước
            </Button>

            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">
                    {labelPrefix} {currentIndex + 1} / {totalCount}
                </span>
            </div>

            <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={currentIndex >= totalCount - 1}
                onClick={onNext}
            >
                {labelPrefix} Tiếp Theo →
            </Button>
        </div>
    );
}

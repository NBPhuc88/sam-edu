import { ChevronDown, Check } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface ScrollableSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: (SelectOption | string)[];
    label?: string;
    placeholder?: string;
    className?: string;
    maxHeightClass?: string;
    placement?: 'bottom' | 'top' | 'auto';
}

export const ScrollableSelect: React.FC<ScrollableSelectProps> = ({
    value,
    onChange,
    options,
    label,
    placeholder = '-- Chọn --',
    className = '',
    maxHeightClass = 'max-h-36',
    placement = 'auto',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [actualPlacement, setActualPlacement] = useState<'bottom' | 'top'>('bottom');
    const containerRef = useRef<HTMLDivElement>(null);

    const formattedOptions: SelectOption[] = options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    const selectedOption = formattedOptions.find((opt) => opt.value === value);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            if (placement === 'top') {
                setActualPlacement('top');
            } else if (placement === 'bottom') {
                setActualPlacement('bottom');
            } else {
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                // If limited space below (e.g. less than 170px), flip upwards
                if (spaceBelow < 170) {
                    setActualPlacement('top');
                } else {
                    setActualPlacement('bottom');
                }
            }
        }
    }, [isOpen, placement]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {label && (
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm font-mono font-bold text-gray-900 shadow-xs transition-colors hover:border-emerald-500 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                    isOpen ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-gray-300'
                }`}
            >
                <span className="truncate whitespace-nowrap">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${
                        isOpen ? (actualPlacement === 'top' ? 'rotate-0 text-emerald-600' : 'rotate-180 text-emerald-600') : ''
                    }`}
                />
            </button>

            {/* Scrollable dropdown list with top/bottom placement */}
            {isOpen && (
                <div
                    className={`absolute left-0 z-50 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 ${maxHeightClass} ${
                        actualPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                    }`}
                >
                    {formattedOptions.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-mono font-medium transition-colors ${
                                    isSelected
                                        ? 'bg-emerald-50 font-bold text-emerald-800'
                                        : 'text-gray-700 hover:bg-slate-100 hover:text-gray-900'
                                }`}
                            >
                                <span>{opt.label}</span>
                                {isSelected && (
                                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ScrollableSelect;

import { Calendar as CalendarIcon, X } from 'lucide-react';
import React, { useRef } from 'react';
import { formatDate, toISODateString } from '@/lib/date';

interface DatePickerProps {
    value: string;
    onChange: (dateStr: string) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    min?: string;
    max?: string;
    required?: boolean;
    clearable?: boolean;
}

export default function DatePicker({
    value,
    onChange,
    className = '',
    placeholder = 'dd-mm-yyyy',
    disabled = false,
    min,
    max,
    required = false,
    clearable = true,
}: DatePickerProps) {
    const hiddenDateInputRef = useRef<HTMLInputElement>(null);

    const isoValue = toISODateString(value);
    const isoMin = min ? toISODateString(min) : undefined;
    const isoMax = max ? toISODateString(max) : undefined;
    const displayValue = value ? formatDate(value) : '';

    const handleContainerClick = (e: React.MouseEvent) => {
        if (disabled) return;
        if (hiddenDateInputRef.current) {
            try {
                if (typeof hiddenDateInputRef.current.showPicker === 'function') {
                    hiddenDateInputRef.current.showPicker();
                } else {
                    hiddenDateInputRef.current.focus();
                    hiddenDateInputRef.current.click();
                }
            } catch {
                hiddenDateInputRef.current.focus();
                hiddenDateInputRef.current.click();
            }
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        onChange('');
        if (hiddenDateInputRef.current) {
            hiddenDateInputRef.current.value = '';
        }
    };

    const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value; // YYYY-MM-DD
        onChange(val);
    };

    const isFullWidth = className.includes('w-full');

    return (
        <div className={`relative ${isFullWidth ? 'w-full block' : 'inline-flex'} items-center`}>
            {/* Display formatted input (dd-mm-yyyy) */}
            <div
                onClick={handleContainerClick}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs transition-colors hover:border-emerald-500 hover:bg-slate-50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 ${
                    disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : ''
                } ${className}`}
            >
                <span className={displayValue ? 'text-gray-900 font-mono' : 'text-gray-400'}>
                    {displayValue || placeholder}
                </span>

                <div className="flex items-center gap-1">
                    {clearable && displayValue && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                            title="Xóa ngày"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <CalendarIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                </div>
            </div>

            {/* Hidden native date input to trigger browser calendar picker */}
            <input
                ref={hiddenDateInputRef}
                type="date"
                value={isoValue}
                onChange={handleNativeDateChange}
                disabled={disabled}
                min={isoMin}
                max={isoMax}
                required={required}
                className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
            />
        </div>
    );
}

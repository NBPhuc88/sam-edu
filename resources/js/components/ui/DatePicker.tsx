import { Calendar as CalendarIcon } from 'lucide-react';
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
}: DatePickerProps) {
    const hiddenDateInputRef = useRef<HTMLInputElement>(null);

    const isoValue = toISODateString(value);
    const displayValue = value ? formatDate(value) : '';

    const handleContainerClick = () => {
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

    const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value; // YYYY-MM-DD
        onChange(val);
    };

    return (
        <div className="relative inline-flex items-center">
            {/* Display formatted input (dd-mm-yyyy) */}
            <div
                onClick={handleContainerClick}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 shadow-2xs transition-colors hover:border-emerald-500 hover:bg-slate-50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 ${
                    disabled ? 'cursor-not-allowed bg-gray-100 opacity-60' : ''
                } ${className}`}
            >
                <span className={displayValue ? 'text-gray-900 font-mono' : 'text-gray-400'}>
                    {displayValue || placeholder}
                </span>
                <CalendarIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            </div>

            {/* Hidden native date input to trigger browser calendar picker */}
            <input
                ref={hiddenDateInputRef}
                type="date"
                value={isoValue}
                onChange={handleNativeDateChange}
                disabled={disabled}
                min={min}
                max={max}
                required={required}
                className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 opacity-0"
                tabIndex={-1}
                aria-hidden="true"
            />
        </div>
    );
}

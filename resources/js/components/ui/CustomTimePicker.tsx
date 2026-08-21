import { Clock, Check, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';

export interface CustomTimePickerProps {
    value?: string;
    onChange: (time: string) => void;
    label?: string;
    className?: string;
    buttonClassName?: string;
    disabled?: boolean;
    placement?: 'top' | 'bottom' | 'auto';
}

const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, '0')); // 06..23
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const QUICK_TIMES = [
    '08:00',
    '10:00',
    '14:00',
    '16:00',
    '18:00',
    '19:30',
    '20:00',
];

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
    value = '18:00',
    onChange,
    label,
    className = '',
    buttonClassName = '',
    disabled = false,
    placement = 'top',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const initialTime = value ? value.slice(0, 5) : '18:00';
    const [selectedHour, setSelectedHour] = useState<string>(initialTime.split(':')[0] || '18');
    const [selectedMinute, setSelectedMinute] = useState<string>(initialTime.split(':')[1] || '00');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const formatted = value.slice(0, 5);
            const [h, m] = formatted.split(':');
            if (h) setSelectedHour(h);
            if (m) setSelectedMinute(m);
        }
    }, [value]);

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

    const handleConfirm = () => {
        const formattedTime = `${selectedHour}:${selectedMinute}`;
        onChange(formattedTime);
        setIsOpen(false);
    };

    const handleQuickSelect = (timeStr: string) => {
        const [h, m] = timeStr.split(':');
        setSelectedHour(h);
        setSelectedMinute(m);
        onChange(timeStr);
        setIsOpen(false);
    };

    const displayTime = `${selectedHour}:${selectedMinute}`;

    const placementClass = placement === 'bottom'
        ? 'top-full mt-1.5'
        : 'bottom-full mb-1.5';

    return (
        <div ref={containerRef} className={`relative inline-block ${className ? className : 'w-full'}`}>
            {label && (
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                    {label}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-xs transition-colors hover:border-emerald-500 hover:bg-emerald-50/30 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                    isOpen ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/50' : 'border-gray-300'
                } ${buttonClassName}`}
            >
                <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold font-mono text-gray-900">{displayTime}</span>
            </button>

            {/* Custom Popover Dropdown (Defaults to opening TOP / above the input) */}
            {isOpen && (
                <div className={`absolute left-0 ${placementClass} z-50 w-64 rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100`}>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                            Chọn Giờ Lớp Học
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Quick presets */}
                    <div className="mb-3">
                        <span className="mb-1.5 block text-[10px] font-bold text-gray-500 uppercase">
                            Khung giờ nhanh:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_TIMES.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleQuickSelect(t)}
                                    className={`rounded border px-2 py-1 text-[11px] font-mono font-semibold transition-colors ${
                                        displayTime === t
                                            ? 'border-emerald-600 bg-emerald-600 text-white'
                                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Hour and Minute Selectors */}
                    <div className="mb-4 grid grid-cols-2 gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                        <div>
                            <label className="mb-1 block text-[10px] font-bold text-gray-600 uppercase">
                                Giờ
                            </label>
                            <select
                                value={selectedHour}
                                onChange={(e) => setSelectedHour(e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-mono font-bold text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                            >
                                {HOURS.map((h) => (
                                    <option key={h} value={h}>
                                        {h} giờ
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-[10px] font-bold text-gray-600 uppercase">
                                Phút
                            </label>
                            <select
                                value={selectedMinute}
                                onChange={(e) => setSelectedMinute(e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-mono font-bold text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                            >
                                {MINUTES.map((m) => (
                                    <option key={m} value={m}>
                                        {m} phút
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* EXPLICIT SAVE BUTTON AT BOTTOM OF POPOVER */}
                    <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2.5">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                            className="!px-2.5 !py-1 !text-xs"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            variant="success"
                            size="sm"
                            icon={<Check className="h-3.5 w-3.5" />}
                            onClick={handleConfirm}
                            className="!px-3 !py-1 !text-xs font-bold"
                        >
                            Lưu Lựa Chọn
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomTimePicker;

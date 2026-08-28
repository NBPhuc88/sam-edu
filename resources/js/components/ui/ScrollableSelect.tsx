import { ChevronDown, Check, Search, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
    value: string | number;
    label: string;
    subLabel?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export interface ScrollableSelectProps {
    value: string | number;
    onChange: (value: string) => void;
    options: (SelectOption | string)[];
    label?: string;
    placeholder?: string;
    className?: string;
    maxHeightClass?: string;
    placement?: 'bottom' | 'top' | 'auto';
    searchable?: boolean;
    searchPlaceholder?: string;
    disabled?: boolean;
    error?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const ScrollableSelect: React.FC<ScrollableSelectProps> = ({
    value,
    onChange,
    options,
    label,
    placeholder = '-- Chọn --',
    className = '',
    maxHeightClass = 'max-h-60',
    placement = 'auto',
    searchable,
    searchPlaceholder = 'Tìm kiếm lựa chọn...',
    disabled = false,
    error,
    size = 'md',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [actualPlacement, setActualPlacement] = useState<'bottom' | 'top'>('bottom');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const formattedOptions: SelectOption[] = options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    const stringValue = String(value ?? '');
    const selectedOption = formattedOptions.find((opt) => String(opt.value) === stringValue);

    // Auto enable search if > 7 options unless explicitly specified false
    const isSearchable = searchable !== undefined ? searchable : formattedOptions.length > 7;

    const filteredOptions = isSearchable && searchTerm.trim()
        ? formattedOptions.filter((opt) =>
              opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : formattedOptions;

    useEffect(() => {
        if (isOpen && containerRef.current) {
            if (placement === 'top') {
                setActualPlacement('top');
            } else if (placement === 'bottom') {
                setActualPlacement('bottom');
            } else {
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;

                // Check distance to nearest modal or overflow container bottom
                let spaceContainerBelow = spaceBelow;
                let parent: HTMLElement | null = containerRef.current.parentElement;
                while (parent && parent !== document.body) {
                    const style = window.getComputedStyle(parent);
                    if (
                        style.overflowY === 'auto' ||
                        style.overflowY === 'hidden' ||
                        style.overflowY === 'scroll' ||
                        parent.getAttribute('role') === 'dialog' ||
                        parent.classList.contains('overflow-hidden') ||
                        parent.classList.contains('overflow-y-auto')
                    ) {
                        const parentRect = parent.getBoundingClientRect();
                        spaceContainerBelow = Math.min(
                            spaceContainerBelow,
                            parentRect.bottom - rect.bottom
                        );
                        break;
                    }
                    parent = parent.parentElement;
                }

                // If limited space below in viewport (< 260px) OR inside modal/container (< 220px), flip upwards if top has room
                if (
                    (spaceBelow < 260 || spaceContainerBelow < 220) &&
                    rect.top > 160
                ) {
                    setActualPlacement('top');
                } else {
                    setActualPlacement('bottom');
                }
            }

            if (isSearchable) {
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 50);
            }
        } else {
            setSearchTerm('');
        }
    }, [isOpen, placement, isSearchable]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSelect = (val: string | number) => {
        onChange(String(val));
        setIsOpen(false);
        setSearchTerm('');
    };

    const sizeClasses = {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-3.5 py-2.5 text-base',
    }[size];

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {label && (
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    {label}
                </label>
            )}

            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between rounded-lg border bg-white text-left font-medium text-gray-900 shadow-xs transition-colors focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${sizeClasses} ${
                    disabled
                        ? 'cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                        : error
                          ? 'border-red-300 ring-1 ring-red-300'
                          : isOpen
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'border-gray-300 hover:border-gray-400'
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && (
                        <span className="shrink-0">{selectedOption.icon}</span>
                    )}
                    <span className={`truncate ${!selectedOption ? 'text-gray-400' : ''}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    {selectedOption?.subLabel && (
                        <span className="text-xs text-gray-400 truncate">
                            ({selectedOption.subLabel})
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${
                        isOpen
                            ? actualPlacement === 'top'
                                ? 'rotate-180 text-emerald-600'
                                : 'rotate-180 text-emerald-600'
                            : ''
                    }`}
                />
            </button>

            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

            {/* Scrollable dropdown list with top/bottom placement */}
            {isOpen && !disabled && (
                <div
                    className={`absolute left-0 z-50 w-full rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 ${
                        actualPlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                    }`}
                >
                    {/* Search box if searchable */}
                    {isSearchable && (
                        <div className="relative mb-1.5 border-b border-gray-100 p-1">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full rounded-md border border-gray-200 bg-slate-50 py-1.5 pl-8 pr-7 text-xs text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Scrollable Items Container */}
                    <div
                        className={`overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5 ${maxHeightClass}`}
                        style={{ scrollbarWidth: 'thin' }}
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === stringValue;
                                return (
                                    <button
                                        key={String(opt.value)}
                                        type="button"
                                        disabled={opt.disabled}
                                        onClick={() => !opt.disabled && handleSelect(opt.value)}
                                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                                            opt.disabled
                                                ? 'cursor-not-allowed opacity-40'
                                                : isSelected
                                                  ? 'bg-emerald-50 font-semibold text-emerald-800'
                                                  : 'text-gray-700 hover:bg-slate-100 hover:text-gray-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 truncate text-left">
                                            {opt.icon && (
                                                <span className="shrink-0">{opt.icon}</span>
                                            )}
                                            <span className="truncate">{opt.label}</span>
                                            {opt.subLabel && (
                                                <span className="text-2xs text-gray-400 truncate">
                                                    ({opt.subLabel})
                                                </span>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-2" />
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-4 text-center text-xs text-gray-400 italic">
                                Không tìm thấy kết quả phù hợp
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScrollableSelect;

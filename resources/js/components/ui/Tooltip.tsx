import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
    content?: React.ReactNode;
    children: React.ReactNode;
    position?: TooltipPosition;
    maxWidth?: string;
    delay?: number;
    className?: string;
    disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    maxWidth = 'max-w-xs',
    delay = 100,
    className = '',
    disabled = false,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; actualPosition: TooltipPosition }>({
        top: 0,
        left: 0,
        actualPosition: position,
    });
    const triggerRef = useRef<HTMLDivElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        // Tooltip dimensions approximate or measured
        const tooltipEl = tooltipRef.current;
        const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 200;
        const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 40;
        const gap = 8;

        let calculatedTop = 0;
        let calculatedLeft = 0;
        let actualPos = position;

        // Check if top space is enough
        if (position === 'top' && rect.top - tooltipHeight - gap < 10) {
            actualPos = 'bottom';
        } else if (position === 'bottom' && rect.bottom + tooltipHeight + gap > window.innerHeight - 10) {
            actualPos = 'top';
        }

        switch (actualPos) {
            case 'bottom':
                calculatedTop = rect.bottom + scrollY + gap;
                calculatedLeft = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'left':
                calculatedTop = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;
                calculatedLeft = rect.left + scrollX - tooltipWidth - gap;
                break;
            case 'right':
                calculatedTop = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;
                calculatedLeft = rect.right + scrollX + gap;
                break;
            case 'top':
            default:
                calculatedTop = rect.top + scrollY - tooltipHeight - gap;
                calculatedLeft = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2;
                break;
        }

        // Viewport horizontal constraint (keep 12px padding from screen edge)
        const minLeft = scrollX + 12;
        const maxLeft = scrollX + window.innerWidth - tooltipWidth - 12;
        if (calculatedLeft < minLeft) calculatedLeft = minLeft;
        if (calculatedLeft > maxLeft) calculatedLeft = maxLeft;

        setCoords({
            top: calculatedTop,
            left: calculatedLeft,
            actualPosition: actualPos,
        });
    }, [position]);

    const handleMouseEnter = () => {
        if (disabled || !content) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            // Re-calculate after render in case tooltip size changed
            const frame = requestAnimationFrame(updatePosition);

            const handleScroll = () => updatePosition();
            const handleResize = () => updatePosition();

            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);

            return () => {
                cancelAnimationFrame(frame);
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [isVisible, updatePosition]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const hasContent = content !== null && content !== undefined && content !== '';

    if (disabled || !hasContent) {
        return <>{children}</>;
    }

    const getInitialAnimation = (pos: TooltipPosition) => {
        switch (pos) {
            case 'bottom':
                return { opacity: 0, y: -4, scale: 0.96 };
            case 'left':
                return { opacity: 0, x: 4, scale: 0.96 };
            case 'right':
                return { opacity: 0, x: -4, scale: 0.96 };
            case 'top':
            default:
                return { opacity: 0, y: 4, scale: 0.96 };
        }
    };

    return (
        <div
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleMouseEnter}
            onBlur={handleMouseLeave}
            className="inline-flex max-w-full"
        >
            {children}

            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {isVisible && (
                            <motion.div
                                ref={tooltipRef}
                                initial={getInitialAnimation(coords.actualPosition)}
                                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                style={{
                                    top: `${coords.top}px`,
                                    left: `${coords.left}px`,
                                    position: 'absolute',
                                }}
                                className={clsx(
                                    'pointer-events-none z-[9999] rounded-lg bg-gray-900/95 px-3 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-xs border border-gray-700/80 leading-relaxed break-words whitespace-normal',
                                    maxWidth,
                                    className,
                                )}
                            >
                                {content}
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </div>
    );
};

export interface TruncatedTextProps {
    text?: string | number | null;
    maxLines?: number;
    maxLength?: number;
    maxWidth?: string;
    position?: TooltipPosition;
    className?: string;
    as?: 'span' | 'div' | 'p';
    tooltipMaxWidth?: string;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
    text,
    maxLines = 1,
    maxLength = 75,
    maxWidth = 'max-w-full',
    position = 'top',
    className = '',
    as = 'div',
    tooltipMaxWidth = 'max-w-sm',
}) => {
    if (text === null || text === undefined || text === '') {
        return null;
    }

    const stringText = String(text);
    const displayText =
        maxLength && stringText.length > maxLength
            ? `${stringText.slice(0, maxLength)}...`
            : stringText;

    const lineClampClass =
        maxLines === 1
            ? 'truncate line-clamp-1'
            : maxLines === 2
              ? 'line-clamp-2'
              : maxLines === 3
                ? 'line-clamp-3'
                : 'line-clamp-4';

    const Tag = as;

    return (
        <Tooltip content={stringText} position={position} maxWidth={tooltipMaxWidth}>
            <Tag className={clsx(lineClampClass, maxWidth, className)} title={undefined}>
                {displayText}
            </Tag>
        </Tooltip>
    );
};

export default Tooltip;

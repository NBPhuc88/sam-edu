import { clsx } from 'clsx';
import { ChevronUp } from 'lucide-react';
import React,{ useCallback,useEffect,useState } from 'react';

export interface ScrollToTopProps {
    /**
     * Vertical scroll distance in pixels before the button appears.
     * @default 250
     */
    threshold?: number;
    /**
     * Smooth scroll animation behavior.
     * @default true
     */
    smooth?: boolean;
    /**
     * Additional CSS classes.
     */
    className?: string;
    /**
     * Optional custom scroll container selector (e.g., 'main' or '#container').
     */
    scrollContainerSelector?: string;
    /**
     * Accessibility label and title tooltip.
     * @default 'Cuộn lên đầu trang'
     */
    ariaLabel?: string;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({
    threshold = 250,
    smooth = true,
    className = '',
    scrollContainerSelector,
    ariaLabel = 'Cuộn lên đầu trang',
}) => {
    const [isVisible, setIsVisible] = useState(false);

    const checkScrollPosition = useCallback(() => {
        if (typeof window === 'undefined') return;

        const windowScroll =
            window.scrollY ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            0;

        let containerScroll = 0;
        if (scrollContainerSelector) {
            const container = document.querySelector(scrollContainerSelector);
            if (container) {
                containerScroll = container.scrollTop;
            }
        } else {
            const mainElement = document.querySelector('main');
            if (mainElement) {
                containerScroll = mainElement.scrollTop;
            }
        }

        const maxScroll = Math.max(windowScroll, containerScroll);
        setIsVisible(maxScroll > threshold);
    }, [threshold, scrollContainerSelector]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        checkScrollPosition();

        // Use capture: true so we capture scroll events on window, document, and any child containers (e.g., main)
        window.addEventListener('scroll', checkScrollPosition, {
            capture: true,
            passive: true,
        });
        window.addEventListener('resize', checkScrollPosition, {
            passive: true,
        });

        return () => {
            window.removeEventListener('scroll', checkScrollPosition, {
                capture: true,
            });
            window.removeEventListener('resize', checkScrollPosition);
        };
    }, [checkScrollPosition]);

    const scrollToTop = () => {
        if (typeof window === 'undefined') return;

        const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto';

        // Scroll window and document elements
        window.scrollTo({
            top: 0,
            left: 0,
            behavior,
        });

        if (document.documentElement) {
            document.documentElement.scrollTo({
                top: 0,
                left: 0,
                behavior,
            });
        }

        if (document.body) {
            document.body.scrollTo({
                top: 0,
                left: 0,
                behavior,
            });
        }

        // Scroll custom container or main if exists
        const container = scrollContainerSelector
            ? document.querySelector(scrollContainerSelector)
            : document.querySelector('main');

        if (container) {
            container.scrollTo({
                top: 0,
                left: 0,
                behavior,
            });
        }
    };

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label={ariaLabel}
            title={ariaLabel}
            className={clsx(
                'group fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-1 ring-white/20 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 hover:-translate-y-1 active:scale-95 sm:bottom-8 sm:right-8 sm:h-12 sm:w-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                isVisible
                    ? 'translate-y-0 scale-100 opacity-100 pointer-events-auto'
                    : 'translate-y-6 scale-75 opacity-0 pointer-events-none',
                className,
            )}
        >
            <ChevronUp className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 sm:h-6 sm:w-6" />
        </button>
    );
};

export default ScrollToTop;

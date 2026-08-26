import React, { useEffect, useState } from 'react';

export interface TocItem {
    id: string;
    text: string;
    level: number;
}

export interface TableOfContentsProps {
    contentSelector?: string;
    title?: string;
    className?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
    contentSelector = '.seo-content',
    title = 'Mục Lục Bài Viết',
    className = '',
}) => {
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const container = document.querySelector(contentSelector);
        if (!container) return;

        const headings = container.querySelectorAll('h2, h3');
        const items: TocItem[] = [];

        headings.forEach((heading, index) => {
            let id = heading.id;
            if (!id) {
                const textStr = heading.textContent || `heading-${index}`;
                id = textStr
                    .toLowerCase()
                    .replace(/[^a-z0-9àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-');
                heading.id = id || `toc-heading-${index}`;
            }

            items.push({
                id: heading.id,
                text: heading.textContent || '',
                level: heading.tagName === 'H2' ? 2 : 3,
            });
        });

        setTocItems(items);

        // Scrollspy effect
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '0px 0px -60% 0px' }
        );

        headings.forEach((heading) => observer.observe(heading));

        return () => observer.disconnect();
    }, [contentSelector]);

    if (tocItems.length === 0) return null;

    const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveId(id);
        }
    };

    return (
        <nav
            aria-label="Table of Contents"
            className={`p-4 my-6 bg-slate-50 border border-slate-200 rounded-xl shadow-sm ${className}`}
        >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 text-slate-900 font-semibold text-base">
                <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h7"
                    />
                </svg>
                <span>{title}</span>
            </div>

            <ul className="space-y-2 text-sm">
                {tocItems.map((item) => (
                    <li
                        key={item.id}
                        className={`${item.level === 3 ? 'pl-4 border-l-2 border-slate-200' : ''}`}
                    >
                        <a
                            href={`#${item.id}`}
                            onClick={(e) => handleScrollTo(e, item.id)}
                            className={`block transition-colors duration-150 ${
                                activeId === item.id
                                    ? 'text-emerald-600 font-semibold'
                                    : 'text-slate-700 hover:text-emerald-600'
                            }`}
                        >
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default TableOfContents;

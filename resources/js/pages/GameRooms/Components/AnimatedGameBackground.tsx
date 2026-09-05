import type { ReactNode } from 'react';
import '../arena.css';
export default function AnimatedGameBackground({
    enabled,
    children,
}: {
    enabled: boolean;
    children: ReactNode;
}) {
    return (
        <div
            className={`arena-shell min-h-screen bg-slate-950 text-white ${enabled ? '' : 'arena-static'}`}
        >
            <div
                className="arena-scenery pointer-events-none fixed inset-0 overflow-hidden"
                aria-hidden="true"
            >
                <div className="arena-aurora" />
                {['▲', '◆', '●', '■'].map((shape, i) => (
                    <span
                        key={shape}
                        className={`arena-shape arena-shape-${i}`}
                    >
                        {shape}
                    </span>
                ))}
            </div>
            <div className="relative z-10">{children}</div>
        </div>
    );
}

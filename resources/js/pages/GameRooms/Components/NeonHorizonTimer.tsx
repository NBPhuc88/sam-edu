export default function NeonHorizonTimer({
    remaining,
    total,
}: {
    remaining: number;
    total: number;
}) {
    const color =
        remaining <= 5 ? '#fb7185' : remaining <= 10 ? '#fbbf24' : '#22d3ee';

    return (
        <div
            className="mb-6"
            role="timer"
            aria-label={`Còn ${Math.ceil(remaining)} giây`}
        >
            <div className="mb-2 flex justify-between text-xs font-bold tracking-widest">
                <span>THỜI GIAN TRẢ LỜI</span>
                <span>{Math.ceil(remaining)}s</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
                <div
                    className={`arena-energy h-full rounded-full ${remaining <= 5 ? 'arena-critical' : ''}`}
                    style={{
                        width: `${Math.min(100, (remaining / total) * 100)}%`,
                        background: color,
                        boxShadow: `0 0 20px ${color}`,
                    }}
                />
            </div>
        </div>
    );
}

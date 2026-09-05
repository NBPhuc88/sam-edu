export default function CinematicWarpPortal5s({
    remaining,
}: {
    remaining: number;
}) {
    return (
        <div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden bg-slate-950/95"
            role="status"
        >
            <div
                className="arena-portal absolute h-80 w-80 rounded-full border-8 border-cyan-300/50"
                aria-hidden="true"
            />
            <p className="relative text-sm font-bold tracking-[0.3em] text-cyan-200">
                CHUẨN BỊ CÂU TIẾP THEO
            </p>
            <span
                key={Math.ceil(remaining)}
                className="arena-count relative text-[10rem] leading-tight font-black text-white"
            >
                {Math.max(1, Math.ceil(remaining))}
            </span>
            <div
                key={`crystals-${Math.ceil(remaining)}`}
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
            >
                {Array.from({ length: 16 }, (_, i) => (
                    <span
                        key={i}
                        className="arena-crystal absolute top-1/2 left-1/2 text-cyan-200"
                        style={{
                            transform: `rotate(${i * 22.5}deg)`,
                            animationDelay: `${(i % 3) * 0.04}s`,
                        }}
                    >
                        ✦
                    </span>
                ))}
            </div>
            <p className="relative text-violet-200">
                Tập trung · Sẵn sàng · Bứt phá
            </p>
        </div>
    );
}

import type { Ranking } from './types';
export default function Podium({ entries }: { entries: Ranking[] }) {
    return (
        <section className="relative overflow-hidden py-14 text-center">
            <p className="text-cyan-300">TRẬN ĐẤU HOÀN THÀNH</p>
            <h1 className="mt-3 text-4xl font-black">Những ngôi sao hôm nay</h1>
            <div className="mt-14 flex items-end justify-center gap-3">
                {[1, 0, 2].map((index) => {
                    const entry = entries[index];

                    return entry ? (
                        <div
                            className="arena-podium w-1/3 max-w-44"
                            key={entry.id}
                        >
                            <p className="mb-3 truncate font-bold">
                                {entry.name}
                            </p>
                            <div
                                className={`rounded-t-2xl bg-linear-to-b ${index === 0 ? 'from-amber-300 to-amber-600' : 'from-violet-400 to-indigo-700'} p-5 text-3xl font-black`}
                                style={{ height: `${210 - index * 50}px` }}
                            >
                                {['👑', '🥈', '🥉'][index]}
                                <p className="mt-4 text-base">
                                    {entry.total_score} PTS
                                </p>
                            </div>
                        </div>
                    ) : null;
                })}
            </div>
            {Array.from({ length: 24 }, (_, i) => (
                <i
                    key={i}
                    aria-hidden="true"
                    className="arena-confetti absolute top-0 h-3 w-2 bg-cyan-300"
                    style={{
                        left: `${i * 4}%`,
                        animationDelay: `${(i % 5) * 0.3}s`,
                        background: ['#fb7185', '#22d3ee', '#fbbf24'][i % 3],
                    }}
                />
            ))}
        </section>
    );
}

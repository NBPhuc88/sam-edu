import { motion } from 'framer-motion';
import type { Ranking } from '../types';
export default function LeaderboardSidebar({
    entries,
}: {
    entries: Ranking[];
}) {
    return (
        <aside className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 lg:sticky lg:top-5 lg:w-72 lg:self-start">
            <h2 className="mb-5 text-lg font-black">🏆 Bảng xếp hạng</h2>
            <ol className="space-y-2">
                {entries.map((entry) => (
                    <motion.li
                        layout
                        key={entry.id}
                        className="flex items-center gap-3 rounded-xl bg-white/5 p-3"
                    >
                        <span className="font-black text-cyan-300">
                            {entry.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">
                                {entry.name}
                            </p>
                            {entry.streak_count > 1 && (
                                <small className="text-amber-300">
                                    STREAK x{entry.streak_count} 🔥
                                </small>
                            )}
                        </div>
                        <strong>{entry.total_score}</strong>
                    </motion.li>
                ))}
            </ol>
            {entries.length === 0 && (
                <p className="text-sm text-slate-400">
                    Đang chờ học sinh tham gia…
                </p>
            )}
        </aside>
    );
}

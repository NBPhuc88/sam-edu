import type { RoomState } from './types';
export default function Lobby({
    room,
    onStart,
    busy,
}: {
    room: RoomState;
    onStart: () => void;
    busy: boolean;
}) {
    return (
        <section className="py-16 text-center">
            <p className="text-xs font-bold tracking-[0.35em] text-cyan-300">
                LIVE QUIZ ARENA
            </p>
            <h1 className="mt-5 text-4xl font-black sm:text-6xl">
                Sẵn sàng tranh tài?
            </h1>
            <p className="mt-6 text-slate-300">Nhập mã PIN để tham gia phòng</p>
            <p className="my-6 text-5xl font-black tracking-[0.2em] text-amber-300 sm:text-7xl">
                {room.pin}
            </p>
            <p>
                {room.participant_count} học sinh đã sẵn sàng ·{' '}
                {room.question_count} câu hỏi · {room.question_time_limit}s /
                câu
            </p>
            {room.is_host ? (
                <button
                    className="arena-button mt-8"
                    disabled={busy || !room.participant_count}
                    onClick={onStart}
                >
                    Bắt đầu trận đấu ⚡
                </button>
            ) : (
                <p className="mt-8 animate-pulse text-cyan-200">
                    Đang chờ Host bắt đầu…
                </p>
            )}
        </section>
    );
}

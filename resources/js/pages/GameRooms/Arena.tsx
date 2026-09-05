import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getEcho } from '@/lib/echo';
import { answer, cancel, index, react, start, sync } from '@/routes/game-rooms';
import AnimatedGameBackground from './Components/AnimatedGameBackground';
import ArenaSoundToggle from './Components/ArenaSoundToggle';
import CinematicWarpPortal5s from './Components/CinematicWarpPortal5s';
import FloatingReactionsOverlay from './Components/FloatingReactionsOverlay';
import GameQuestionAnswer from './Components/GameQuestionAnswer';
import LeaderboardSidebar from './Components/LeaderboardSidebar';
import NeonHorizonTimer from './Components/NeonHorizonTimer';
import Lobby from './Lobby';
import Podium from './Podium';
import { createSyncCoordinator } from './sync-coordinator';
import type { Answer, RoomState } from './types';

async function request(url: string, body?: unknown, signal?: AbortSignal) {
    const token = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)?.[1];
    const response = await fetch(url, {
        signal,
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(
            error.message || 'Không thể kết nối. Vui lòng thử lại.',
        );
    }

    return response.json();
}
export default function Arena({ initialRoom }: { initialRoom: RoomState }) {
    const [room, setRoom] = useState(initialRoom);
    const [effects, setEffects] = useState(
        () =>
            localStorage.getItem('arena-effects') !== 'off' &&
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    const [cancelOpen, setCancelOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [reactions, setReactions] = useState<{ id: number; emoji: string }[]>(
        [],
    );
    const [initialClock] = useState(() => ({
        room: initialRoom,
        offset: Date.parse(initialRoom.server_time) - Date.now(),
    }));
    const clock = useRef(initialClock);
    const syncController = useRef<AbortController | null>(null);
    const mounted = useRef(true);
    const actionInFlight = useRef(false);
    const remainingNow = useCallback(
        () =>
            Math.max(
                0,
                ((clock.current.room.expires_at
                    ? Date.parse(clock.current.room.expires_at)
                    : 0) -
                    Date.now() -
                    clock.current.offset) /
                    1000,
            ),
        [],
    );
    const [remaining, setRemaining] = useState(() =>
        Math.max(
            0,
            (Date.parse(initialRoom.expires_at ?? initialRoom.server_time) -
                Date.parse(initialRoom.server_time)) /
                1000,
        ),
    );
    const coordinator = useRef<ReturnType<typeof createSyncCoordinator> | null>(
        null,
    );
    const runSync = useCallback(async () => {
        if (!mounted.current) {
            return;
        }

        const controller = new AbortController();
        syncController.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), 10000);

        try {
            const sentAt = Date.now();
            const next: RoomState = await request(
                sync.url(initialRoom.id),
                undefined,
                controller.signal,
            );

            if (!mounted.current || controller.signal.aborted) {
                return;
            }

            clock.current = {
                room: next,
                offset:
                    Date.parse(next.server_time) - (sentAt + Date.now()) / 2,
            };
            setRoom(next);
            setRemaining(remainingNow());
            setError('');
        } catch (cause) {
            if (mounted.current && !controller.signal.aborted) {
                setError(
                    cause instanceof Error ? cause.message : 'Mất kết nối',
                );
            }
        } finally {
            window.clearTimeout(timeout);

            if (syncController.current === controller) {
                syncController.current = null;
            }
        }
    }, [initialRoom.id, remainingNow]);
    const refresh = useCallback(() => {
        coordinator.current ??= createSyncCoordinator(runSync);

        return coordinator.current();
    }, [runSync]);
    useEffect(() => {
        mounted.current = true;
        const echo = getEcho();
        const channelName = `game-room.${initialRoom.id}`;
        const channel = echo.private(channelName);
        const events = [
            'GameRoomParticipantJoined',
            'GameRoomStarted',
            'GameRoomQuestionStarted',
            'GameRoomAnswerCountUpdated',
            'GameRoomQuestionEnded',
            'GameRoomLeaderboardUpdated',
            'GameRoomCompleted',
        ];
        events.forEach((event) => channel.listen(event, () => void refresh()));
        channel.listen('GameRoomReactionSent', (event: { emoji: string }) =>
            setReactions((previous) => [
                ...previous.slice(-9),
                { id: Date.now(), emoji: event.emoji },
            ]),
        );
        channel.subscribed(() => void refresh());
        const resume = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            setRemaining(remainingNow());
            syncController.current?.abort();
            echo.connect();
            void refresh();
        };
        const timer = window.setInterval(
            () => setRemaining(remainingNow()),
            100,
        );
        const polling = window.setInterval(() => {
            if (
                document.visibilityState === 'visible' &&
                ![4, 5].includes(clock.current.room.status)
            ) {
                void refresh();
            }
        }, 1500);
        document.addEventListener('visibilitychange', resume);
        window.addEventListener('focus', resume);
        window.addEventListener('pageshow', resume);
        window.addEventListener('online', resume);
        const initialSync = window.setTimeout(() => void refresh(), 0);

        return () => {
            clearTimeout(initialSync);
            mounted.current = false;
            coordinator.current = null;
            syncController.current?.abort();
            clearInterval(timer);
            clearInterval(polling);
            echo.leave(channelName);
            document.removeEventListener('visibilitychange', resume);
            window.removeEventListener('focus', resume);
            window.removeEventListener('pageshow', resume);
            window.removeEventListener('online', resume);
        };
    }, [initialRoom.id, refresh, remainingNow]);
    const act = async (url: string, body: unknown = {}) => {
        if (actionInFlight.current) {
            return;
        }

        actionInFlight.current = true;
        setBusy(true);
        setError('');

        try {
            await request(url, body);
            await refresh();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : 'Không thể gửi yêu cầu',
            );
        } finally {
            actionInFlight.current = false;
            setBusy(false);
        }
    };
    const submit = (value: Answer) => {
        if (remainingNow() > 0 && !room.my_answer) {
            void act(answer.url(room.id), {
                question_index: room.question_index,
                answer: value,
            });
        }
    };

    return (
        <AnimatedGameBackground enabled={effects}>
            <Head title={`Đấu trường · ${room.name}`} />
            <div className="mx-auto max-w-7xl p-4 sm:p-8">
                <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
                    <Link href={index()} className="text-sm text-slate-300">
                        ← Đấu trường
                    </Link>
                    <span className="text-sm font-bold">
                        {room.name} · {room.code}
                    </span>
                    <button
                        onClick={() => {
                            setEffects(!effects);
                            localStorage.setItem(
                                'arena-effects',
                                effects ? 'off' : 'on',
                            );
                        }}
                        className="rounded-full border border-white/20 px-4 py-2 text-xs"
                    >
                        Hiệu ứng: {effects ? 'Bật' : 'Tắt'}
                    </button>
                    <ArenaSoundToggle
                        countdown={
                            room.status === 3 &&
                            room.question_index + 1 < room.question_count
                                ? Math.ceil(remaining)
                                : null
                        }
                    />
                </header>
                {error && (
                    <p
                        role="alert"
                        className="mb-4 rounded-xl bg-rose-950 p-4 text-rose-200"
                    >
                        {error}{' '}
                        <button
                            onClick={() => void refresh()}
                            className="underline"
                        >
                            Đồng bộ lại
                        </button>
                    </p>
                )}
                <div className="flex flex-col gap-6 lg:flex-row">
                    <main className="min-w-0 flex-1">
                        {room.status === 1 && (
                            <Lobby
                                room={room}
                                busy={busy}
                                onStart={() => void act(start.url(room.id))}
                            />
                        )}
                        {room.status === 4 && (
                            <Podium entries={room.leaderboard} />
                        )}
                        {room.status === 5 && (
                            <h1 className="py-20 text-center text-3xl font-black">
                                Trận đấu đã hủy
                            </h1>
                        )}
                        {room.question && [2, 3].includes(room.status) && (
                            <>
                                <NeonHorizonTimer
                                    remaining={
                                        room.status === 2 ? remaining : 0
                                    }
                                    total={room.question_time_limit}
                                />
                                <div className="mb-5 flex justify-between text-xs text-cyan-200">
                                    <span>
                                        CÂU {room.question_index + 1} /{' '}
                                        {room.question_count}
                                    </span>
                                    <span>
                                        {room.answer_count}/
                                        {room.participant_count} bạn đã trả lời
                                    </span>
                                </div>
                                <section className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8">
                                    {room.question.section_description && (
                                        <p className="mb-5 text-sm whitespace-pre-wrap text-slate-300">
                                            {room.question.section_description}
                                        </p>
                                    )}
                                    <h1 className="mb-3 text-2xl font-black">
                                        {room.question.title}
                                    </h1>
                                    <p className="text-lg whitespace-pre-wrap">
                                        {room.question.content}
                                    </p>
                                    {room.question.image_url && (
                                        <img
                                            src={room.question.image_url}
                                            alt="Hình minh họa câu hỏi"
                                            className="mx-auto mt-4 max-h-64 rounded-xl"
                                        />
                                    )}
                                    {room.question.audio_url && (
                                        <audio
                                            controls
                                            src={room.question.audio_url}
                                            className="mt-4 w-full"
                                        />
                                    )}
                                </section>
                                {room.is_student ? (
                                    <>
                                        <GameQuestionAnswer
                                            key={room.question_index}
                                            question={room.question}
                                            savedAnswer={room.my_answer?.answer}
                                            disabled={
                                                busy ||
                                                !!room.my_answer ||
                                                room.status !== 2 ||
                                                remaining <= 0
                                            }
                                            onSubmit={submit}
                                        />
                                        {room.my_answer && (
                                            <p className="mt-5 text-center text-lg font-bold text-cyan-200">
                                                ⚡ Đã chọn trong{' '}
                                                {room.my_answer.response_seconds.toFixed(
                                                    2,
                                                )}
                                                s · +{room.my_answer.points} PTS
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="rounded-2xl border border-cyan-400/20 p-6 text-center text-cyan-200">
                                        Chế độ{' '}
                                        {room.is_host ? 'Host' : 'giám sát'} ·
                                        Theo dõi câu trả lời và bảng xếp hạng
                                    </p>
                                )}
                            </>
                        )}
                        {room.is_host && ![4, 5].includes(room.status) && (
                            <button
                                disabled={busy}
                                onClick={() => setCancelOpen(true)}
                                className="mt-8 text-sm text-rose-300 underline"
                            >
                                Hủy trận đấu
                            </button>
                        )}
                        <div className="mt-8 flex justify-center gap-3">
                            {['🔥', '👏', '⚡', '❤️'].map((emoji) => (
                                <button
                                    key={emoji}
                                    disabled={busy}
                                    aria-label={`Gửi cảm xúc ${emoji}`}
                                    onClick={() =>
                                        void act(react.url(room.id), { emoji })
                                    }
                                    className="rounded-full bg-white/10 p-3 text-2xl"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </main>
                    <LeaderboardSidebar entries={room.leaderboard} />
                </div>
            </div>
            {room.status === 3 &&
                room.question_index + 1 < room.question_count && (
                    <CinematicWarpPortal5s remaining={remaining} />
                )}
            <ConfirmDialog
                isOpen={cancelOpen}
                onClose={() => setCancelOpen(false)}
                onConfirm={() => {
                    setCancelOpen(false);
                    void act(cancel.url(room.id));
                }}
                title="Hủy trận đấu"
                message="Trận đấu sẽ kết thúc và không thể tiếp tục. Bạn muốn hủy?"
            />
            <FloatingReactionsOverlay reactions={reactions} />
        </AnimatedGameBackground>
    );
}

import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Clock,
    Copy,
    Check,
    Play,
    Plus,
    Radio,
    Sparkles,
    Trophy,
    Users,
    Zap,
    RotateCcw,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { create, join, show } from '@/routes/game-rooms';

interface RoomItem {
    id: number;
    code: string;
    pin: string;
    name: string;
    status: number;
    question_index: number;
    total_questions: number;
    participants_count: number;
    host_name: string;
    is_host: boolean;
    is_participant: boolean;
    created_at: string;
}

export default function Index({
    rooms,
    isStudent,
}: {
    rooms: RoomItem[];
    isStudent: boolean;
}) {
    const form = useForm({ pin: '' });
    const [filterTab, setFilterTab] = useState<'all' | 'live' | 'waiting' | 'completed'>('all');
    const [copiedPin, setCopiedPin] = useState<string | null>(null);

    const handleCopyPin = (e: React.MouseEvent, pin: string) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(pin);
        setCopiedPin(pin);
        setTimeout(() => setCopiedPin(null), 2000);
    };

    // Active rooms that the user is directly involved in (hosting or participating)
    const myActiveRooms = useMemo(() => {
        return rooms.filter(
            (r) => (r.is_host || r.is_participant) && [1, 2, 3].includes(r.status),
        );
    }, [rooms]);

    // Filtered rooms based on selected tab
    const filteredRooms = useMemo(() => {
        if (filterTab === 'live') {
            return rooms.filter((r) => [2, 3].includes(r.status));
        }
        if (filterTab === 'waiting') {
            return rooms.filter((r) => r.status === 1);
        }
        if (filterTab === 'completed') {
            return rooms.filter((r) => [4, 5].includes(r.status));
        }
        return rooms;
    }, [rooms, filterTab]);

    const handleQuickJoin = (pin: string) => {
        form.setData('pin', pin);
        router.post(join.url(), { pin });
    };

    return (
        <AppLayout title="Đấu Trường Trực Tiếp">
            <Head title="Đấu Trường Trực Tiếp - Live Quiz Arena" />

            <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
                {/* ─── Hero Banner ─── */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-6 sm:p-10 text-white shadow-2xl border border-indigo-900/50">
                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div className="max-w-2xl space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-cyan-300 uppercase">
                                <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
                                Live Quiz Arena
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                                Đấu Trường Tri Thức Trực Tiếp
                            </h1>
                            <p className="text-sm sm:text-base text-slate-300">
                                Tham gia thi đấu trực tiếp, trả lời câu hỏi siêu tốc, giành điểm bứt phá và vinh danh trên Bảng xếp hạng thời gian thực!
                            </p>
                        </div>

                        <div className="shrink-0">
                            {isStudent ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        form.post(join.url());
                                    }}
                                    className="flex flex-col sm:flex-row gap-2.5 rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/15"
                                >
                                    <div className="relative">
                                        <input
                                            id="pin"
                                            inputMode="numeric"
                                            pattern="[0-9]{6}"
                                            maxLength={6}
                                            required
                                            value={form.data.pin}
                                            onChange={(e) => form.setData('pin', e.target.value)}
                                            placeholder="Nhập mã PIN 6 số..."
                                            className="w-full sm:w-48 rounded-xl bg-white px-4 py-3 text-center text-lg font-black tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-6 py-3 font-bold text-slate-950 hover:from-cyan-300 hover:to-teal-300 active:scale-95 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 cursor-pointer"
                                    >
                                        <Zap className="h-5 w-5 fill-current" />
                                        Tham gia ⚡
                                    </button>
                                </form>
                            ) : (
                                <Link
                                    href={create()}
                                    className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-7 py-4 text-base font-black text-slate-950 shadow-xl shadow-cyan-500/25 hover:from-cyan-300 hover:to-emerald-300 active:scale-95 transition cursor-pointer"
                                >
                                    <Plus className="h-5 w-5 stroke-[3]" />
                                    Tạo phòng thi đấu mới ⚡
                                </Link>
                            )}
                            {form.errors.pin && (
                                <p role="alert" className="mt-2 text-xs font-semibold text-rose-300">
                                    {form.errors.pin}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Banner: Phòng Đang Chạy Của Bạn (Re-enter Alert) ─── */}
                {myActiveRooms.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-rose-600 font-black text-sm uppercase tracking-wider">
                            <Radio className="h-4 w-4 animate-pulse" />
                            Phòng thi đấu bạn đang tham gia (Cần quay lại ngay)
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {myActiveRooms.map((room) => (
                                <div
                                    key={`active-${room.id}`}
                                    className="relative overflow-hidden rounded-2xl border-2 border-rose-500/80 bg-gradient-to-br from-rose-50/90 via-white to-orange-50/80 p-5 shadow-lg shadow-rose-500/10 transition hover:shadow-xl"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                                                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                                                {[2, 3].includes(room.status)
                                                    ? `Đang thi đấu · Câu ${room.question_index + 1}/${room.total_questions}`
                                                    : 'Đang chờ trong sảnh'}
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 line-clamp-1">
                                                {room.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-3">
                                                <span>Mã: <strong className="text-slate-800">{room.code}</strong></span>
                                                <span>PIN: <strong className="text-rose-600 font-mono tracking-widest">{room.pin}</strong></span>
                                                <span>Host: {room.host_name}</span>
                                            </p>
                                        </div>

                                        <Link
                                            href={show(room.id)}
                                            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-rose-600/30 hover:bg-rose-700 active:scale-95 transition"
                                        >
                                            <Play className="h-4 w-4 fill-current" />
                                            {room.is_host ? 'Điều khiển 🎮' : 'Vào lại ngay ⚡'}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Danh Sách Phòng & Bộ Lọc ─── */}
                <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-slate-900">
                                Danh Sách Phòng Trò Chơi
                            </h2>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                                {filteredRooms.length}
                            </span>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-bold">
                            <button
                                onClick={() => setFilterTab('all')}
                                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                                    filterTab === 'all'
                                        ? 'bg-white text-slate-950 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Tất cả ({rooms.length})
                            </button>
                            <button
                                onClick={() => setFilterTab('live')}
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 transition cursor-pointer ${
                                    filterTab === 'live'
                                        ? 'bg-white text-rose-600 shadow-sm font-black'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                Đang diễn ra ({rooms.filter((r) => [2, 3].includes(r.status)).length})
                            </button>
                            <button
                                onClick={() => setFilterTab('waiting')}
                                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                                    filterTab === 'waiting'
                                        ? 'bg-white text-amber-600 shadow-sm font-black'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Sảnh chờ ({rooms.filter((r) => r.status === 1).length})
                            </button>
                            <button
                                onClick={() => setFilterTab('completed')}
                                className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                                    filterTab === 'completed'
                                        ? 'bg-white text-slate-950 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Đã kết thúc ({rooms.filter((r) => [4, 5].includes(r.status)).length})
                            </button>
                        </div>
                    </div>

                    {/* Room Cards Grid */}
                    {filteredRooms.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredRooms.map((room) => {
                                const isLive = [2, 3].includes(room.status);
                                const isWaiting = room.status === 1;
                                const isFinished = [4, 5].includes(room.status);

                                return (
                                    <div
                                        key={room.id}
                                        className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                                            isLive
                                                ? 'border-rose-300 ring-2 ring-rose-100'
                                                : isWaiting
                                                ? 'border-amber-200'
                                                : 'border-slate-200 opacity-80 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="space-y-3">
                                            {/* Status Badge & Code */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    {isLive && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600 border border-rose-200">
                                                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                                                            Đang thi đấu
                                                        </span>
                                                    )}
                                                    {isWaiting && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                                                            <Clock className="h-3 w-3 text-amber-600" />
                                                            Sảnh chờ
                                                        </span>
                                                    )}
                                                    {isFinished && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                                            <Trophy className="h-3 w-3 text-slate-400" />
                                                            {room.status === 4 ? 'Hoàn thành' : 'Đã hủy'}
                                                        </span>
                                                    )}
                                                    {room.is_host && (
                                                        <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-extrabold text-purple-700">
                                                            HOST
                                                        </span>
                                                    )}
                                                    {room.is_participant && !room.is_host && (
                                                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                                                            ĐÃ VÀO
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="font-mono text-xs font-bold text-slate-400">
                                                    {room.code}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-700 transition line-clamp-1">
                                                    {room.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Chủ phòng: <span className="font-medium text-slate-700">{room.host_name}</span>
                                                </p>
                                            </div>

                                            {/* Details Bar */}
                                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{room.participants_count} thí sinh</span>
                                                </div>

                                                {/* PIN Code with copy button */}
                                                <button
                                                    onClick={(e) => handleCopyPin(e, room.pin)}
                                                    title="Bấm để sao chép mã PIN"
                                                    className="inline-flex items-center gap-1 font-mono font-black text-slate-800 hover:text-cyan-600 transition cursor-pointer"
                                                >
                                                    <span>PIN: {room.pin}</span>
                                                    {copiedPin === room.pin ? (
                                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action Button Footer */}
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                                            {room.is_host || room.is_participant ? (
                                                <Link
                                                    href={show(room.id)}
                                                    className={`w-full text-center rounded-xl py-2.5 px-4 text-xs font-black transition cursor-pointer shadow-sm ${
                                                        isLive
                                                            ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20'
                                                            : isWaiting
                                                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {room.is_host
                                                        ? (isFinished ? 'Xem lại kết quả 🏆' : 'Tiếp tục điều khiển 🎮')
                                                        : (isFinished ? 'Xem bảng điểm 🏆' : 'Quay lại thi đấu ⚡')}
                                                </Link>
                                            ) : isStudent && isWaiting ? (
                                                <button
                                                    onClick={() => handleQuickJoin(room.pin)}
                                                    className="w-full text-center rounded-xl bg-cyan-600 py-2.5 px-4 text-xs font-black text-white hover:bg-cyan-700 transition cursor-pointer shadow-sm shadow-cyan-500/20"
                                                >
                                                    Tham gia sảnh chờ 🚪
                                                </button>
                                            ) : (
                                                <Link
                                                    href={show(room.id)}
                                                    className="w-full text-center rounded-xl bg-slate-100 py-2.5 px-4 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                                                >
                                                    {isFinished ? 'Xem kết quả' : 'Xem phòng'}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                            <Sparkles className="h-10 w-10 text-slate-300 mb-3" />
                            <h3 className="text-base font-bold text-slate-700">
                                {filterTab === 'live'
                                    ? 'Hiện không có phòng nào đang thi đấu'
                                    : filterTab === 'waiting'
                                    ? 'Không có phòng nào đang trong sảnh chờ'
                                    : 'Chưa có phòng trò chơi nào'}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 max-w-sm">
                                {isStudent
                                    ? 'Nhập mã PIN của giáo viên cung cấp ở trên để tham gia phòng thi đấu ngay.'
                                    : 'Bấm nút "Tạo phòng thi đấu mới" ở trên để khởi tạo một đấu trường trực tiếp cho lớp.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

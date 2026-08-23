import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    Pin,
    PinOff,
    Send,
    ArrowLeft,
    MessageSquare,
    ShieldCheck,
    GraduationCap,
    User,
    Wifi,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import AppLayout from '@/layouts/AppLayout';
import { getEcho } from '@/lib/echo';

interface SchoolClass {
    id: number;
    code: string;
    name: string;
    center?: { id: number; name: string };
}

interface CurrentUser {
    sender_type: 'admin' | 'teacher' | 'student';
    sender_id: number;
    sender_name: string;
    sender_avatar: string | null;
    can_pin: boolean;
}

interface ChatMessageData {
    id: number;
    class_id: number;
    sender_type: 'admin' | 'teacher' | 'student';
    sender_id: number;
    sender_name: string;
    sender_avatar: string | null;
    message: string;
    is_pinned: boolean;
    pinned_at: string | null;
    pinned_by_name: string | null;
    created_at: string;
    time_formatted: string;
}

interface Props {
    schoolClass: SchoolClass;
    currentUser: CurrentUser;
    initialMessages: ChatMessageData[];
    initialPinnedMessage: ChatMessageData | null;
}

export default function ClassChatPage({
    schoolClass,
    currentUser,
    initialMessages,
    initialPinnedMessage,
}: Props) {
    const [messages, setMessages] = useState<ChatMessageData[]>(
        initialMessages || [],
    );
    const [pinnedMessage, setPinnedMessage] = useState<ChatMessageData | null>(
        initialPinnedMessage,
    );
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [wsConnected, setWsConnected] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom('auto');
    }, []);

    // ─── Realtime WebSocket Subscription (Soketi / Pusher) ───
    useEffect(() => {
        const echo = getEcho();
        const channelName = `class-chat.${schoolClass.id}`;
        const channel = echo.channel(channelName);

        channel.listen('.message.sent', (newMsg: ChatMessageData) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) {
                    return prev;
                }
                return [...prev, newMsg];
            });
            setTimeout(() => scrollToBottom('smooth'), 100);
        });

        channel.listen(
            '.message.pinned',
            (data: {
                class_id: number;
                pinned_message: ChatMessageData | null;
            }) => {
                const newPinned = data.pinned_message;
                setPinnedMessage(newPinned);
                setMessages((prev) =>
                    prev.map((msg) => ({
                        ...msg,
                        is_pinned: newPinned ? msg.id === newPinned.id : false,
                    })),
                );
            },
        );

        setWsConnected(true);

        return () => {
            echo.leave(channelName);
        };
    }, [schoolClass.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputMessage.trim() || isSending) {
            return;
        }

        const textToSend = inputMessage.trim();
        setInputMessage('');
        setIsSending(true);

        try {
            const response = await axios.post<{
                success: boolean;
                message: ChatMessageData;
            }>(`/classes/${schoolClass.id}/chat/messages`, {
                message: textToSend,
            });

            if (response.data?.success && response.data.message) {
                const sentMsg = response.data.message;
                setMessages((prev) => {
                    if (prev.some((m) => m.id === sentMsg.id)) {
                        return prev;
                    }
                    return [...prev, sentMsg];
                });
                setTimeout(() => scrollToBottom('smooth'), 50);
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            setInputMessage(textToSend); // khôi phục tin nhắn nếu lỗi
        } finally {
            setIsSending(false);
        }
    };

    const handleTogglePin = async (messageId: number) => {
        if (!currentUser.can_pin) {
            return;
        }

        try {
            const response = await axios.post<{
                success: boolean;
                pinned_message: ChatMessageData | null;
            }>(`/classes/${schoolClass.id}/chat/messages/${messageId}/pin`);

            if (response.data?.success) {
                const newPinned = response.data.pinned_message;
                setPinnedMessage(newPinned);
                setMessages((prev) =>
                    prev.map((msg) => ({
                        ...msg,
                        is_pinned: newPinned ? msg.id === newPinned.id : false,
                    })),
                );
            }
        } catch (error) {
            console.error('Lỗi khi ghim tin nhắn:', error);
        }
    };

    const scrollToMessage = (messageId: number) => {
        const elem = messageRefs.current[messageId];
        if (elem) {
            elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            elem.classList.add('bg-amber-100/80');
            setTimeout(() => {
                elem.classList.remove('bg-amber-100/80');
            }, 2000);
        }
    };

    const getSenderBadge = (type: string) => {
        switch (type) {
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-2xs font-bold text-emerald-800">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        Admin
                    </span>
                );
            case 'teacher':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-2xs font-bold text-blue-800">
                        <GraduationCap className="h-3 w-3 text-blue-600" />
                        Giáo viên
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-2xs font-medium text-slate-700">
                        <User className="h-3 w-3 text-slate-500" />
                        Học sinh
                    </span>
                );
        }
    };

    return (
        <AppLayout title={`Nhóm Chat Lớp ${schoolClass.name}`}>
            <Head title={`Nhóm Chat Lớp ${schoolClass.name}`} />

            <div className="mx-auto max-w-5xl space-y-3">
                {/* Back Navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/classes"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 transition-colors hover:text-emerald-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Danh Sách Lớp Học</span>
                    </Link>

                    {/* Realtime Status Indicator */}
                    <div className="flex items-center gap-1.5 text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <Wifi className="h-3 w-3" />
                        <span>Realtime WebSocket</span>
                    </div>
                </div>

                {/* Main Chat Container - Strictly Flex column spanning full available height */}
                <div className="flex h-[calc(100vh-175px)] min-h-[520px] flex-col rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
                    {/* Header: shrink-0 at the top */}
                    <div className="shrink-0 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3.5 sm:px-6 sm:py-4 text-white">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-xs">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold truncate">
                                    Nhóm Chat: {schoolClass.name}
                                </h2>
                                <p className="text-2xs sm:text-xs text-slate-400 truncate">
                                    Mã lớp: {schoolClass.code} •{' '}
                                    {schoolClass.center?.name || 'Trung tâm Sam Edu'}
                                </p>
                            </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                            <span className="block text-2xs text-slate-400">
                                Bạn đang đăng nhập:
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-emerald-400">
                                {currentUser.sender_name}
                            </span>
                        </div>
                    </div>

                    {/* Pinned Message Banner: shrink-0 under header */}
                    {pinnedMessage && (
                        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 px-4 py-2.5 sm:px-5 sm:py-3 text-amber-950 shadow-2xs">
                            <div
                                onClick={() => scrollToMessage(pinnedMessage.id)}
                                className="flex min-w-0 flex-1 items-start gap-2.5 cursor-pointer group"
                                title="Nhấp để cuộn tới tin nhắn này"
                            >
                                <Pin className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-amber-600 group-hover:scale-110 transition-transform" />
                                <div className="min-w-0 text-xs sm:text-sm">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                        <span>Tin nhắn đã ghim</span>
                                        <span className="text-2xs font-normal text-amber-700">
                                            (bởi {pinnedMessage.pinned_by_name || 'Giáo viên/Admin'})
                                        </span>
                                    </div>
                                    <div className="mt-0.5 truncate font-medium text-gray-800">
                                        "{pinnedMessage.message}"
                                    </div>
                                </div>
                            </div>

                            {currentUser.can_pin && (
                                <button
                                    type="button"
                                    onClick={() => handleTogglePin(pinnedMessage.id)}
                                    title="Bỏ ghim tin nhắn này"
                                    className="shrink-0 rounded-lg p-1.5 text-amber-700 hover:bg-amber-100 hover:text-amber-900 transition-colors"
                                >
                                    <PinOff className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Messages Body: flex-1 takes all available space, scrolls independently */}
                    <div className="flex-1 min-h-0 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
                        {messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400 py-12">
                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                    <MessageSquare className="h-8 w-8 text-gray-300 stroke-1" />
                                </div>
                                <p className="text-sm sm:text-base font-bold text-gray-700">
                                    Chưa có tin nhắn nào trong nhóm chat này.
                                </p>
                                <p className="mt-1 text-xs text-gray-400 max-w-xs">
                                    Hãy là người đầu tiên gửi tin nhắn để cùng trao đổi học tập với lớp!
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isSelf =
                                    msg.sender_type === currentUser.sender_type &&
                                    msg.sender_id === currentUser.sender_id;

                                return (
                                    <div
                                        key={msg.id}
                                        ref={(el) => {
                                            messageRefs.current[msg.id] = el;
                                        }}
                                        className={`flex items-start gap-2.5 sm:gap-3 transition-colors duration-500 rounded-xl p-1 ${
                                            isSelf ? 'flex-row-reverse' : 'flex-row'
                                        }`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm font-black text-white shadow-2xs ${
                                                msg.sender_type === 'admin'
                                                    ? 'bg-emerald-600'
                                                    : msg.sender_type === 'teacher'
                                                    ? 'bg-blue-600'
                                                    : 'bg-slate-700'
                                            }`}
                                        >
                                            {msg.sender_name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Message Bubble Container */}
                                        <div
                                            className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${
                                                isSelf ? 'items-end text-right' : 'items-start text-left'
                                            }`}
                                        >
                                            {/* Sender Name & Role & Timestamp */}
                                            <div
                                                className={`flex items-center gap-1.5 text-2xs ${
                                                    isSelf ? 'justify-end' : 'justify-start'
                                                }`}
                                            >
                                                <span className="font-bold text-gray-800">
                                                    {msg.sender_name}
                                                </span>
                                                {getSenderBadge(msg.sender_type)}
                                                <span className="text-gray-400">
                                                    {msg.time_formatted}
                                                </span>
                                            </div>

                                            {/* Message Content Bubble with optional Pin action */}
                                            <div className="group relative flex items-center gap-1.5">
                                                {/* Left Pin button for self messages if Admin/Teacher */}
                                                {isSelf && currentUser.can_pin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePin(msg.id)}
                                                        title={msg.is_pinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
                                                        className={`rounded-full p-1.5 transition-all hover:bg-gray-200 ${
                                                            msg.is_pinned
                                                                ? 'text-amber-600 opacity-100'
                                                                : 'text-gray-400 opacity-0 group-hover:opacity-100'
                                                        }`}
                                                    >
                                                        <Pin
                                                            className={`h-3.5 w-3.5 ${
                                                                msg.is_pinned ? 'fill-amber-500' : ''
                                                            }`}
                                                        />
                                                    </button>
                                                )}

                                                <div
                                                    className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs break-words ${
                                                        isSelf
                                                            ? 'rounded-tr-xs bg-emerald-600 text-white'
                                                            : 'rounded-tl-xs border border-gray-200 bg-white text-gray-900'
                                                    } ${
                                                        msg.is_pinned
                                                            ? 'ring-2 ring-amber-400 bg-amber-50/50'
                                                            : ''
                                                    }`}
                                                >
                                                    {msg.message}
                                                </div>

                                                {/* Right Pin button for other messages if Admin/Teacher */}
                                                {!isSelf && currentUser.can_pin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePin(msg.id)}
                                                        title={msg.is_pinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
                                                        className={`rounded-full p-1.5 transition-all hover:bg-gray-200 ${
                                                            msg.is_pinned
                                                                ? 'text-amber-600 opacity-100'
                                                                : 'text-gray-400 opacity-0 group-hover:opacity-100'
                                                        }`}
                                                    >
                                                        <Pin
                                                            className={`h-3.5 w-3.5 ${
                                                                msg.is_pinned ? 'fill-amber-500' : ''
                                                            }`}
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Footer: shrink-0 pinned firmly at the bottom */}
                    <div className="shrink-0 border-t border-gray-200 bg-white p-3 sm:p-4">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Nhập tin nhắn để trao đổi cùng lớp học..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                disabled={isSending}
                                className="flex-1 rounded-xl border border-gray-300 bg-slate-50/60 px-4 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-colors"
                            />
                            <Button
                                type="submit"
                                variant="success"
                                size="md"
                                disabled={isSending || !inputMessage.trim()}
                                isLoading={isSending}
                                className="shrink-0 flex items-center gap-1.5 px-4 sm:px-5 !py-2.5 font-bold text-xs sm:text-sm"
                            >
                                <Send className="h-4 w-4" />
                                <span className="hidden sm:inline">Gửi</span>
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

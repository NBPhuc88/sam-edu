import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    Pin,
    PinOff,
    Send,
    ArrowLeft,
    Smile,
    Palette,
    Check,
    X,
    Reply,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/AppLayout';
import { getEcho } from '@/lib/echo';
import ChatEmojiPicker from './components/ChatEmojiPicker';
import MessageReactionBar from './components/MessageReactionBar';
import MessageReactionsDisplay, {
    ReactionItem,
} from './components/MessageReactionsDisplay';

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

interface ReplyToData {
    id: number;
    class_id: number;
    sender_type: string;
    sender_id: number;
    sender_name: string;
    message: string;
}

interface ChatMessageData {
    id: number;
    class_id: number;
    reply_to_id?: number | null;
    reply_to?: ReplyToData | null;
    reactions?: ReactionItem[];
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

// Telegram Sender Name Distinct Colors
const SENDER_COLORS = [
    'text-[#e11d48]', // Rose / Red
    'text-[#d97706]', // Amber / Orange
    'text-[#16a34a]', // Emerald / Green
    'text-[#ea580c]', // Coral / Orange-Red
    'text-[#2563eb]', // Blue
    'text-[#9333ea]', // Purple
    'text-[#0891b2]', // Cyan
    'text-[#db2777]', // Pink
    'text-[#4f46e5]', // Indigo
];

const AVATAR_BG_COLORS = [
    'bg-[#f59e0b]', // Amber
    'bg-[#3b82f6]', // Blue
    'bg-[#10b981]', // Emerald
    'bg-[#ef4444]', // Red
    'bg-[#8b5cf6]', // Purple
    'bg-[#ec4899]', // Pink
    'bg-[#06b6d4]', // Cyan
    'bg-[#14b8a6]', // Teal
];

export interface ChatTheme {
    id: string;
    name: string;
    bgColor: string;
    previewColor: string;
    patternOpacity: number;
    selfBubbleClass: string;
    selfTextClass: string;
    badge: string;
}

export const CHAT_THEMES: ChatTheme[] = [
    {
        id: 'classic_green',
        name: 'Xanh Cổ Điển (Mặc định)',
        bgColor: '#7ba97e',
        previewColor: '#7ba97e',
        patternOpacity: 0.16,
        selfBubbleClass: 'bg-[#effdde]',
        selfTextClass: 'text-gray-900',
        badge: 'Telegram',
    },
    {
        id: 'ocean_teal',
        name: 'Đại Dương Xanh',
        bgColor: '#4a8b94',
        previewColor: '#4a8b94',
        patternOpacity: 0.16,
        selfBubbleClass: 'bg-[#daf0f2]',
        selfTextClass: 'text-gray-900',
        badge: 'Tươi Mát',
    },
    {
        id: 'sky_blue',
        name: 'Bầu Trời Xanh',
        bgColor: '#5c92b8',
        previewColor: '#5c92b8',
        patternOpacity: 0.16,
        selfBubbleClass: 'bg-[#e2f0fc]',
        selfTextClass: 'text-gray-900',
        badge: 'Thanh Nhã',
    },
    {
        id: 'midnight_dark',
        name: 'Đêm Huyền Bí',
        bgColor: '#1a242f',
        previewColor: '#1a242f',
        patternOpacity: 0.12,
        selfBubbleClass: 'bg-[#2b5278]',
        selfTextClass: 'text-white',
        badge: 'Dark Mode',
    },
    {
        id: 'lavender_purple',
        name: 'Tím Oải Hương',
        bgColor: '#786b8b',
        previewColor: '#786b8b',
        patternOpacity: 0.16,
        selfBubbleClass: 'bg-[#f0e6ff]',
        selfTextClass: 'text-gray-900',
        badge: 'Mộng Mơ',
    },
    {
        id: 'sunset_warm',
        name: 'Hoàng Hôn Ấm Áp',
        bgColor: '#ba755e',
        previewColor: '#ba755e',
        patternOpacity: 0.16,
        selfBubbleClass: 'bg-[#fceed8]',
        selfTextClass: 'text-gray-900',
        badge: 'Ấm Áp',
    },
    {
        id: 'sakura_pink',
        name: 'Hồng Hoa Anh Đào',
        bgColor: '#ba7684',
        previewColor: '#ba7684',
        patternOpacity: 0.16,
        selfBubbleClass: 'bg-[#ffe8ee]',
        selfTextClass: 'text-gray-900',
        badge: 'Dễ Thương',
    },
    {
        id: 'minimal_slate',
        name: 'Xám Tối Giản',
        bgColor: '#526173',
        previewColor: '#526173',
        patternOpacity: 0.14,
        selfBubbleClass: 'bg-[#e7eff9]',
        selfTextClass: 'text-gray-900',
        badge: 'Hiện Đại',
    },
];

function getSenderColor(name: string, id: number): string {
    const hash =
        (id * 37 +
            name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
        SENDER_COLORS.length;
    return SENDER_COLORS[Math.abs(hash)];
}

function getAvatarBgColor(name: string, id: number): string {
    const hash =
        (id * 19 +
            name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
        AVATAR_BG_COLORS.length;
    return AVATAR_BG_COLORS[Math.abs(hash)];
}

function getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function isImageOrSticker(text: string): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    return (
        /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(trimmed) ||
        trimmed.startsWith('data:image/')
    );
}

export default function ClassChatPage({
    schoolClass,
    currentUser,
    initialMessages,
    initialPinnedMessage,
}: Props) {
    const [messages, setMessages] = useState<ChatMessageData[]>(
        initialMessages || []
    );
    const [pinnedMessage, setPinnedMessage] = useState<ChatMessageData | null>(
        initialPinnedMessage
    );
    const [inputMessage, setInputMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessageData | null>(null);
    const [activeHoverMessageId, setActiveHoverMessageId] = useState<
        number | null
    >(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return (
                localStorage.getItem('sam_chat_wallpaper_theme') ||
                'classic_green'
            );
        }
        return 'classic_green';
    });
    const [showThemeModal, setShowThemeModal] = useState(false);

    const activeTheme =
        CHAT_THEMES.find((t) => t.id === selectedThemeId) || CHAT_THEMES[0];

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleSelectTheme = (themeId: string) => {
        setSelectedThemeId(themeId);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sam_chat_wallpaper_theme', themeId);
        }
        setShowThemeModal(false);
    };

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom('auto');
    }, []);

    // Focus input when reply is triggered
    useEffect(() => {
        if (replyingTo && inputRef.current) {
            inputRef.current.focus();
        }
    }, [replyingTo]);

    // ─── Realtime WebSocket Subscription (Soketi / Pusher) ───
    useEffect(() => {
        const echo = getEcho();
        const channelName = `class-chat.${schoolClass.id}`;
        const channel = echo.channel(channelName);

        // 1. New Message Sent
        channel.listen('.message.sent', (newMsg: ChatMessageData) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) {
                    return prev;
                }
                return [...prev, newMsg];
            });
            setTimeout(() => scrollToBottom('smooth'), 100);
        });

        // 2. Message Pinned / Unpinned
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
                    }))
                );
            }
        );

        // 3. Message Reacted
        channel.listen(
            '.message.reacted',
            (data: {
                class_id: number;
                message_id: number;
                reactions: ReactionItem[];
            }) => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === data.message_id
                            ? { ...msg, reactions: data.reactions }
                            : msg
                    )
                );
            }
        );

        return () => {
            echo.leave(channelName);
        };
    }, [schoolClass.id]);

    // Send Message (with optional reply_to_id)
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputMessage.trim() || isSending) {
            return;
        }

        const textToSend = inputMessage.trim();
        const replyToId = replyingTo ? replyingTo.id : null;

        setInputMessage('');
        setReplyingTo(null);
        setShowEmojiPicker(false);
        setIsSending(true);

        try {
            const response = await axios.post<{
                success: boolean;
                message: ChatMessageData;
            }>(`/classes/${schoolClass.id}/chat/messages`, {
                message: textToSend,
                reply_to_id: replyToId,
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
            setInputMessage(textToSend);
        } finally {
            setIsSending(false);
        }
    };

    // Toggle Pin Message
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
                    }))
                );
            }
        } catch (error) {
            console.error('Lỗi khi ghim tin nhắn:', error);
        }
    };

    // Toggle Reaction
    const handleToggleReaction = async (messageId: number, emoji: string) => {
        try {
            const response = await axios.post<{
                success: boolean;
                reactions: ReactionItem[];
            }>(
                `/classes/${schoolClass.id}/chat/messages/${messageId}/reactions`,
                {
                    emoji,
                }
            );

            if (response.data?.success) {
                const updatedReactions = response.data.reactions;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageId
                            ? { ...msg, reactions: updatedReactions }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error('Lỗi khi thả cảm xúc:', error);
        }
    };

    // Scroll to message with flash animation
    const scrollToMessage = (messageId: number) => {
        const elem = messageRefs.current[messageId];
        if (elem) {
            elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            elem.classList.add('ring-4', 'ring-amber-300');
            setTimeout(() => {
                elem.classList.remove('ring-4', 'ring-amber-300');
            }, 2000);
        }
    };

    // Insert Emoji into input at cursor position
    const handleSelectEmoji = (emoji: string) => {
        if (!inputRef.current) {
            setInputMessage((prev) => prev + emoji);
            return;
        }

        const start = inputRef.current.selectionStart || 0;
        const end = inputRef.current.selectionEnd || 0;
        const updated =
            inputMessage.substring(0, start) +
            emoji +
            inputMessage.substring(end);
        setInputMessage(updated);

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(
                    start + emoji.length,
                    start + emoji.length
                );
            }
        }, 10);
    };

    const renderRoleBadge = (type: string) => {
        switch (type) {
            case 'admin':
                return (
                    <span className="inline-flex items-center rounded-full bg-[#f3e8ff] px-2 py-0.5 text-[11px] font-medium text-[#7e22ce] shadow-2xs">
                        người sở hữu
                    </span>
                );
            case 'teacher':
                return (
                    <span className="inline-flex items-center rounded-full bg-[#dbeafe] px-2 py-0.5 text-[11px] font-medium text-[#1d4ed8] shadow-2xs">
                        giáo viên
                    </span>
                );
            default:
                return null;
        }
    };

    // SVG Doodle Pattern dynamic background generator
    const getTelegramWallpaperStyle = (
        theme: ChatTheme
    ): React.CSSProperties => {
        return {
            backgroundColor: theme.bgColor,
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 80%), url("data:image/svg+xml,%3Csvg width='320' height='320' viewBox='0 0 320 320' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='${theme.patternOpacity}' fill-rule='evenodd'%3E%3Cpath d='M38 48c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm4 0c0 3.3 2.7 6 6 6s6-2.7 6-6-2.7-6-6-6-6 2.7-6 6zm100-24l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2 6-12zm-3 8.5l-3.5 7-7.7 1.1 5.6 5.4-1.3 7.7 6.9-3.6 6.9 3.6-1.3-7.7 5.6-5.4-7.7-1.1-3.5-7zM246 36c6.6 0 12 5.4 12 12s-5.4 12-12 12-12-5.4-12-12 5.4-12 12-12zm0 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm-180 94c8.8 0 16 7.2 16 16 0 4.8-2.1 9.1-5.5 12l5.5 12-12-5.5c-1.3.3-2.6.5-4 .5-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 4c-6.6 0-12 5.4-12 12s5.4 12 12 12c1.2 0 2.4-.2 3.5-.6l6.5 3-3-6.5c1.9-2.2 3-5 3-7.9 0-6.6-5.4-12-12-12zm184 8c12 0 22 10 22 22s-10 22-22 22-22-10-22-22 10-22 22-22zm0 4c-9.9 0-18 8.1-18 18s8.1 18 18 18 18-8.1 18-18-8.1-18-18-18zm-100 24c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14zm0 4c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm-104 90l16-8 16 8-4-18 13-13-18-3-7-16-7 16-18 3 13 13-4 18zm140 10c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20zm4 0c0 8.8 7.2 16 16 16s16-7.2 16-16-7.2-16-16-16-16 7.2-16 16zm-50 40c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10zm110-30l10 5-2-11 8-8-11-2-5-10-5 10-11 2 8 8-2 11 10-5z'/%3E%3C/g%3E%3C/svg%3E")`,
        };
    };

    return (
        <AppLayout title={`Nhóm Chat Lớp ${schoolClass.name}`}>
            <Head title={`Nhóm Chat Lớp ${schoolClass.name}`} />

            <div className="mx-auto max-w-4xl space-y-3">
                {/* Back Navigation, Theme Picker & Status */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <Link
                        href="/classes"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 transition-colors hover:text-emerald-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Danh Sách Lớp Học</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {/* Theme Wallpaper Picker Button */}
                        <button
                            type="button"
                            onClick={() => setShowThemeModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Đổi hình nền trò chuyện"
                        >
                            <span
                                className="h-3.5 w-3.5 rounded-full border border-black/20 shadow-2xs shrink-0"
                                style={{
                                    backgroundColor: activeTheme.previewColor,
                                }}
                            />
                            <Palette className="h-3.5 w-3.5 text-gray-600" />
                            <span className="hidden sm:inline">
                                Hình nền: {activeTheme.name.split(' (')[0]}
                            </span>
                            <span className="sm:hidden">Nền</span>
                        </button>

                        {/* Realtime Status Indicator */}
                        <div className="flex items-center gap-1.5 text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Chat Container - Telegram Canvas */}
                <div className="flex h-[calc(100vh-175px)] min-h-[540px] flex-col rounded-2xl border border-gray-300/80 shadow-md overflow-hidden bg-slate-900">
                    {/* Telegram Style Top Header */}
                    <div className="shrink-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 font-bold text-white shadow-xs">
                                {schoolClass.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                                    {schoolClass.name}
                                </h2>
                                <p className="text-2xs sm:text-xs text-gray-500 truncate">
                                    Mã lớp: {schoolClass.code} •{' '}
                                    {schoolClass.center?.name ||
                                        'Trung tâm SAM Digital'}
                                </p>
                            </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                            <span className="block text-2xs text-gray-400">
                                Đang là:
                            </span>
                            <span className="text-xs font-bold text-emerald-600">
                                {currentUser.sender_name}
                            </span>
                        </div>
                    </div>

                    {/* Pinned Message Banner */}
                    {pinnedMessage && (
                        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-amber-200/80 bg-white/95 backdrop-blur-xs px-4 py-2 sm:px-5 text-gray-900 shadow-2xs border-l-4 border-l-amber-500">
                            <div
                                onClick={() =>
                                    scrollToMessage(pinnedMessage.id)
                                }
                                className="flex min-w-0 flex-1 items-center gap-2.5 cursor-pointer group"
                                title="Nhấp để cuộn tới tin nhắn này"
                            >
                                <Pin className="h-4 w-4 shrink-0 fill-amber-500 text-amber-600 group-hover:scale-110 transition-transform" />
                                <div className="min-w-0 text-xs">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                        <span>Tin nhắn đã ghim</span>
                                        <span className="text-2xs font-normal text-gray-500">
                                            (từ{' '}
                                            {pinnedMessage.pinned_by_name ||
                                                'Admin/Giáo viên'}
                                            )
                                        </span>
                                    </div>
                                    <div className="truncate text-gray-700">
                                        "{pinnedMessage.message}"
                                    </div>
                                </div>
                            </div>

                            {currentUser.can_pin && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleTogglePin(pinnedMessage.id)
                                    }
                                    title="Bỏ ghim tin nhắn này"
                                    className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                >
                                    <PinOff className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Telegram Messages Canvas with Dynamic Wallpaper Theme */}
                    <div
                        style={getTelegramWallpaperStyle(activeTheme)}
                        className="flex-1 min-h-0 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 space-y-1.5"
                    >
                        {messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center text-white/90 py-12">
                                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mb-3 shadow-inner">
                                    <Smile className="h-8 w-8 text-white stroke-2" />
                                </div>
                                <p className="text-sm sm:text-base font-bold text-white drop-shadow-xs">
                                    Chưa có tin nhắn nào trong nhóm chat này
                                </p>
                                <p className="mt-1 text-xs text-white/80 max-w-xs drop-shadow-xs">
                                    Hãy là người đầu tiên gửi tin nhắn để cùng
                                    trao đổi học tập với lớp!
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isSelf =
                                    msg.sender_type ===
                                        currentUser.sender_type &&
                                    msg.sender_id === currentUser.sender_id;

                                const isHovered =
                                    activeHoverMessageId === msg.id;

                                // Grouping logic (Cluster consecutive messages from the same sender)
                                const prevMsg =
                                    index > 0 ? messages[index - 1] : null;
                                const nextMsg =
                                    index < messages.length - 1
                                        ? messages[index + 1]
                                        : null;

                                const isSameSenderAsPrev =
                                    prevMsg !== null &&
                                    prevMsg.sender_type === msg.sender_type &&
                                    prevMsg.sender_id === msg.sender_id;

                                const isSameSenderAsNext =
                                    nextMsg !== null &&
                                    nextMsg.sender_type === msg.sender_type &&
                                    nextMsg.sender_id === msg.sender_id;

                                const isFirstInGroup = !isSameSenderAsPrev;
                                const isLastInGroup = !isSameSenderAsNext;

                                const senderColorClass = getSenderColor(
                                    msg.sender_name,
                                    msg.sender_id
                                );
                                const avatarBgColor = getAvatarBgColor(
                                    msg.sender_name,
                                    msg.sender_id
                                );
                                const initials = getInitials(msg.sender_name);
                                const isSticker = isImageOrSticker(msg.message);

                                return (
                                    <div
                                        key={msg.id}
                                        ref={(el) => {
                                            messageRefs.current[msg.id] = el;
                                        }}
                                        onMouseEnter={() =>
                                            setActiveHoverMessageId(msg.id)
                                        }
                                        onMouseLeave={() =>
                                            setActiveHoverMessageId(null)
                                        }
                                        className={`flex items-end gap-2 transition-all duration-300 ${
                                            isFirstInGroup ? 'mt-3' : 'mt-0.5'
                                        } ${
                                            isSelf
                                                ? 'justify-end'
                                                : 'justify-start'
                                        }`}
                                    >
                                        {/* Avatar on Left (for other senders) */}
                                        {!isSelf && (
                                            <div className="w-8.5 shrink-0 flex items-end">
                                                {isLastInGroup ? (
                                                    msg.sender_avatar ? (
                                                        <img
                                                            src={
                                                                msg.sender_avatar
                                                            }
                                                            alt={
                                                                msg.sender_name
                                                            }
                                                            className="h-8.5 w-8.5 rounded-full object-cover shadow-xs border border-white/40"
                                                            onError={(e) => {
                                                                (
                                                                    e.target as HTMLElement
                                                                ).style.display =
                                                                    'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className={`h-8.5 w-8.5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs border border-white/40 ${avatarBgColor}`}
                                                        >
                                                            {initials}
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="w-8.5 h-8.5" />
                                                )}
                                            </div>
                                        )}

                                        {/* Message Bubble Container */}
                                        <div
                                            className={`relative max-w-[85%] sm:max-w-[70%] group flex flex-col ${
                                                isSelf
                                                    ? 'items-end'
                                                    : 'items-start'
                                            }`}
                                        >
                                            {/* Quick Reaction Floating Bar on Hover */}
                                            {isHovered && (
                                                <MessageReactionBar
                                                    isSelf={isSelf}
                                                    onReact={(emoji) =>
                                                        handleToggleReaction(
                                                            msg.id,
                                                            emoji
                                                        )
                                                    }
                                                    onReply={() =>
                                                        setReplyingTo(msg)
                                                    }
                                                    onTogglePin={() =>
                                                        handleTogglePin(msg.id)
                                                    }
                                                    isPinned={msg.is_pinned}
                                                    canPin={currentUser.can_pin}
                                                />
                                            )}

                                            {/* Sticker / Image Message */}
                                            {isSticker ? (
                                                <div className="relative overflow-hidden rounded-2xl shadow-sm bg-white/10 backdrop-blur-2xs">
                                                    <img
                                                        src={msg.message.trim()}
                                                        alt="sticker"
                                                        className="max-h-56 max-w-56 object-contain rounded-2xl"
                                                        onError={(e) => {
                                                            (
                                                                e.target as HTMLElement
                                                            ).style.display =
                                                                'none';
                                                        }}
                                                    />
                                                    <span className="absolute bottom-1.5 right-2 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                                                        {msg.time_formatted}
                                                    </span>
                                                </div>
                                            ) : (
                                                /* Standard Telegram Text Bubble */
                                                <div
                                                    className={`relative px-3.5 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.12)] break-words text-[13.5px] leading-[1.35] transition-shadow ${
                                                        isSelf
                                                            ? `${activeTheme.selfBubbleClass} ${
                                                                  activeTheme.selfTextClass
                                                              } rounded-2xl ${
                                                                  isLastInGroup
                                                                      ? 'rounded-br-xs'
                                                                      : ''
                                                              }`
                                                            : `bg-white text-gray-900 rounded-2xl ${
                                                                  isLastInGroup
                                                                      ? 'rounded-bl-xs'
                                                                      : ''
                                                              }`
                                                    } ${
                                                        msg.is_pinned
                                                            ? 'ring-2 ring-amber-400 bg-amber-50/90'
                                                            : ''
                                                    }`}
                                                >
                                                    {/* Sender Name & Role Badge (Only on first message of cluster for non-self) */}
                                                    {!isSelf &&
                                                        isFirstInGroup && (
                                                            <div className="flex items-center justify-between gap-2.5 mb-1 select-none">
                                                                <span
                                                                    className={`font-bold text-[13px] tracking-tight ${senderColorClass}`}
                                                                >
                                                                    {
                                                                        msg.sender_name
                                                                    }
                                                                </span>
                                                                {renderRoleBadge(
                                                                    msg.sender_type
                                                                )}
                                                            </div>
                                                        )}

                                                    {/* Telegram Style Quoted Message (Reply) */}
                                                    {msg.reply_to && (
                                                        <div
                                                            onClick={() =>
                                                                scrollToMessage(
                                                                    msg.reply_to!
                                                                        .id
                                                                )
                                                            }
                                                            className={`mb-1.5 cursor-pointer rounded-lg border-l-3 px-2.5 py-1 text-xs transition-all hover:opacity-90 select-none ${
                                                                isSelf
                                                                    ? 'border-emerald-600 bg-black/5 text-gray-800'
                                                                    : 'border-emerald-500 bg-emerald-50/70 text-gray-800'
                                                            }`}
                                                            title="Nhấp để xem tin nhắn gốc"
                                                        >
                                                            <div className="font-bold text-emerald-800 text-[11px] truncate flex items-center gap-1">
                                                                <Reply className="h-3 w-3 inline" />
                                                                <span>
                                                                    {
                                                                        msg
                                                                            .reply_to
                                                                            .sender_name
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="truncate text-gray-600 text-2xs italic">
                                                                {
                                                                    msg.reply_to
                                                                        .message
                                                                }
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Text Message Content + Telegram Inline Timestamp */}
                                                    <div>
                                                        <span>
                                                            {msg.message}
                                                        </span>
                                                        <span
                                                            className={`float-right ml-3 mt-1 inline-block text-[11px] font-normal select-none leading-none ${
                                                                isSelf &&
                                                                activeTheme.id ===
                                                                    'midnight_dark'
                                                                    ? 'text-slate-300'
                                                                    : 'text-gray-400'
                                                            }`}
                                                        >
                                                            {msg.time_formatted}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reactions Badges below Message Bubble */}
                                            {msg.reactions &&
                                                msg.reactions.length > 0 && (
                                                    <MessageReactionsDisplay
                                                        reactions={
                                                            msg.reactions
                                                        }
                                                        currentUserId={
                                                            currentUser.sender_id
                                                        }
                                                        currentUserType={
                                                            currentUser.sender_type
                                                        }
                                                        onToggleReaction={(
                                                            emoji
                                                        ) =>
                                                            handleToggleReaction(
                                                                msg.id,
                                                                emoji
                                                            )
                                                        }
                                                        isSelf={isSelf}
                                                    />
                                                )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Telegram Style Chat Input Footer with Active Reply Banner */}
                    <div className="shrink-0 border-t border-gray-200 bg-white relative">
                        {/* Active Reply Banner */}
                        {replyingTo && (
                            <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50/90 px-4 py-2 text-xs animate-in slide-in-from-bottom-2 duration-150">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Reply className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <div className="min-w-0">
                                        <span className="font-bold text-emerald-950">
                                            Đang trả lời {replyingTo.sender_name}
                                            :
                                        </span>{' '}
                                        <span className="text-gray-600 truncate inline-block max-w-xs sm:max-w-md align-bottom">
                                            {replyingTo.message}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setReplyingTo(null)}
                                    title="Hủy trả lời"
                                    className="rounded-full p-1 text-gray-400 hover:bg-emerald-100 hover:text-gray-700 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* Emoji Picker Popup */}
                        <ChatEmojiPicker
                            isOpen={showEmojiPicker}
                            onClose={() => setShowEmojiPicker(false)}
                            onSelectEmoji={handleSelectEmoji}
                        />

                        {/* Input Controls */}
                        <form
                            onSubmit={handleSendMessage}
                            className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3"
                        >
                            {/* Emoji Picker Toggle Button */}
                            <button
                                type="button"
                                onClick={() =>
                                    setShowEmojiPicker((prev) => !prev)
                                }
                                title="Bảng chọn biểu tượng cảm xúc (Emoji)"
                                className={`p-2 rounded-full transition-colors shrink-0 cursor-pointer ${
                                    showEmojiPicker
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'text-gray-500 hover:text-emerald-700 hover:bg-gray-100'
                                }`}
                            >
                                <Smile className="h-5 w-5" />
                            </button>

                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={
                                    replyingTo
                                        ? `Trả lời ${replyingTo.sender_name}...`
                                        : 'Viết tin nhắn...'
                                }
                                value={inputMessage}
                                onChange={(e) =>
                                    setInputMessage(e.target.value)
                                }
                                disabled={isSending}
                                className="flex-1 rounded-full border border-gray-300/80 bg-gray-50/80 px-4 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 transition-all"
                            />

                            <button
                                type="submit"
                                disabled={isSending || !inputMessage.trim()}
                                className="h-9.5 w-9.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 shrink-0 cursor-pointer"
                                title="Gửi tin nhắn"
                            >
                                <Send className="h-4 w-4 ml-0.5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal: Wallpaper Theme Picker */}
            {showThemeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
                                    <Palette className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        Chọn Hình Nền Trò Chuyện
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Tùy chỉnh màu sắc & hoa văn doodle
                                        Telegram theo phong cách yêu thích
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowThemeModal(false)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Themes Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                            {CHAT_THEMES.map((theme) => {
                                const isSelected = theme.id === activeTheme.id;
                                return (
                                    <button
                                        key={theme.id}
                                        type="button"
                                        onClick={() =>
                                            handleSelectTheme(theme.id)
                                        }
                                        className={`group relative flex flex-col items-center rounded-xl p-2.5 text-left border-2 transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-2xs'
                                        }`}
                                    >
                                        {/* Preview Wallpaper Tile with Doodle Pattern */}
                                        <div
                                            style={getTelegramWallpaperStyle(
                                                theme
                                            )}
                                            className="relative h-24 w-full rounded-lg shadow-inner overflow-hidden border border-black/10 flex items-center justify-center transition-transform group-hover:scale-102"
                                        >
                                            <div className="rounded-md bg-white/90 px-2 py-0.5 text-2xs font-bold text-gray-800 shadow-2xs backdrop-blur-xs">
                                                {theme.badge}
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                                    <Check className="h-3 w-3 stroke-[3]" />
                                                </div>
                                            )}
                                        </div>

                                        <span className="mt-2 text-xs font-bold text-gray-800 text-center line-clamp-1">
                                            {theme.name.split(' (')[0]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-3">
                            <span className="text-2xs text-gray-400">
                                Lựa chọn hình nền sẽ được lưu tự động trên trình
                                duyệt này.
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowThemeModal(false)}
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

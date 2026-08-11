import { Head } from '@inertiajs/react';
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
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import AppLayout from '@/layouts/AppLayout';

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
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Polling fallback để lấy tin nhắn mới và tin nhắn ghim thời gian thực
    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const res = await axios.get<{
                    messages: ChatMessageData[];
                    pinned_message: ChatMessageData | null;
                }>(`/classes/${schoolClass.id}/chat/messages`);

                if (res.data) {
                    setMessages(res.data.messages || []);
                    setPinnedMessage(res.data.pinned_message);
                }
            } catch {
                // Ignore error
            }
        };

        const interval = setInterval(fetchLatest, 3000);

        return () => clearInterval(interval);
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
                setMessages((prev) => [...prev, response.data.message]);
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
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

    const getSenderBadge = (type: string) => {
        switch (type) {
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        Admin
                    </span>
                );
            case 'teacher':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                        <GraduationCap className="h-3 w-3 text-blue-600" />
                        Giáo viên
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        <User className="h-3 w-3 text-slate-500" />
                        Học sinh
                    </span>
                );
        }
    };

    return (
        <AppLayout title={`Nhóm Chat Lớp ${schoolClass.name}`}>
            <Head title={`Nhóm Chat Lớp ${schoolClass.name}`} />

            <div className="mx-auto max-w-5xl space-y-4">
                {/* Back Link */}
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Quay lại Lớp học
                </button>

                <Card className="flex h-[750px] flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 p-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white shadow-sm">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold">
                                    Nhóm Chat Lớp: {schoolClass.name} (
                                    {schoolClass.code})
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {schoolClass.center?.name ||
                                        'Trung tâm Sam Edu'}{' '}
                                    • Real-time Redis Chat
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="block text-xs text-slate-300">
                                Đăng nhập với tư cách:
                            </span>
                            <span className="text-xs font-semibold text-emerald-400">
                                {currentUser.sender_name} (
                                {currentUser.sender_type.toUpperCase()})
                            </span>
                        </div>
                    </div>

                    {/* Pinned Message Banner */}
                    {pinnedMessage && (
                        <div className="animate-fadeIn flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 p-3 text-amber-900">
                            <div className="flex min-w-0 items-start gap-2.5">
                                <Pin className="mt-0.5 h-4 w-4 shrink-0 fill-amber-500 text-amber-600" />
                                <div className="min-w-0 text-xs">
                                    <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                                        <span>Tin nhắn đã ghim</span>
                                        <span className="text-[10px] font-normal text-amber-600">
                                            (bởi{' '}
                                            {pinnedMessage.pinned_by_name ||
                                                'Giáo viên/Admin'}
                                            )
                                        </span>
                                    </div>
                                    <div className="mt-0.5 truncate font-medium text-gray-800">
                                        "{pinnedMessage.message}"
                                    </div>
                                </div>
                            </div>

                            {currentUser.can_pin && (
                                <button
                                    onClick={() =>
                                        handleTogglePin(pinnedMessage.id)
                                    }
                                    title="Bỏ ghim tin nhắn"
                                    className="shrink-0 rounded p-1 text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-900"
                                >
                                    <PinOff className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Chat Messages Body */}
                    <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
                        {messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                                <MessageSquare className="mb-2 h-12 w-12 stroke-1 text-gray-300" />
                                <p className="text-sm font-medium">
                                    Chưa có tin nhắn nào trong nhóm chat này.
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Hãy là người đầu tiên gửi tin nhắn trao đổi!
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isSelf =
                                    msg.sender_type ===
                                        currentUser.sender_type &&
                                    msg.sender_id === currentUser.sender_id;

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-2.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        {/* Avatar */}
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-xs font-bold text-slate-700">
                                            {msg.sender_name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        {/* Message Bubble Container */}
                                        <div
                                            className={`max-w-[70%] space-y-1 ${isSelf ? 'items-end' : 'items-start'}`}
                                        >
                                            {/* Author Info & Badge */}
                                            <div
                                                className={`flex items-center gap-2 text-xs ${
                                                    isSelf
                                                        ? 'justify-end'
                                                        : 'justify-start'
                                                }`}
                                            >
                                                <span className="font-semibold text-gray-800">
                                                    {msg.sender_name}
                                                </span>
                                                {getSenderBadge(
                                                    msg.sender_type,
                                                )}
                                                <span className="text-[10px] text-gray-400">
                                                    {msg.time_formatted}
                                                </span>
                                            </div>

                                            {/* Message Content Bubble */}
                                            <div className="group relative flex items-center gap-2">
                                                <div
                                                    className={`rounded-2xl p-3 text-sm leading-relaxed shadow-xs ${
                                                        isSelf
                                                            ? 'rounded-tr-xs bg-emerald-600 text-white'
                                                            : 'rounded-tl-xs border border-gray-200 bg-white text-gray-900'
                                                    } ${msg.is_pinned ? 'ring-2 ring-amber-400' : ''}`}
                                                >
                                                    {msg.message}
                                                </div>

                                                {/* Action: Pin Button for Admin/Teacher */}
                                                {currentUser.can_pin && (
                                                    <button
                                                        onClick={() =>
                                                            handleTogglePin(
                                                                msg.id,
                                                            )
                                                        }
                                                        title={
                                                            msg.is_pinned
                                                                ? 'Bỏ ghim'
                                                                : 'Ghim tin nhắn'
                                                        }
                                                        className={`rounded-full p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-200 ${
                                                            msg.is_pinned
                                                                ? 'text-amber-600 opacity-100'
                                                                : 'text-gray-400'
                                                        }`}
                                                    >
                                                        <Pin
                                                            className={`h-3.5 w-3.5 ${msg.is_pinned ? 'fill-amber-500' : ''}`}
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

                    {/* Chat Input Footer */}
                    <div className="border-t border-gray-200 bg-white p-3">
                        <form
                            onSubmit={handleSendMessage}
                            className="flex items-center gap-2"
                        >
                            <Input
                                placeholder="Nhập tin nhắn để trao đổi cùng lớp học..."
                                value={inputMessage}
                                onChange={(e) =>
                                    setInputMessage(e.target.value)
                                }
                                className="flex-1 py-2.5 text-sm"
                                disabled={isSending}
                            />
                            <Button
                                type="submit"
                                variant="success"
                                disabled={isSending || !inputMessage.trim()}
                                className="flex items-center gap-1.5 px-4 py-2.5"
                            >
                                <Send className="h-4 w-4" />
                                <span>Gửi</span>
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}

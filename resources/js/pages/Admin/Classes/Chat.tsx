import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Pin, PinOff, Send, ArrowLeft, MessageSquare, ShieldCheck, GraduationCap, User } from 'lucide-react';
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
    const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages || []);
    const [pinnedMessage, setPinnedMessage] = useState<ChatMessageData | null>(initialPinnedMessage);
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
                const res = await axios.get<{ messages: ChatMessageData[]; pinned_message: ChatMessageData | null }>(
                    `/classes/${schoolClass.id}/chat/messages`
                );

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
            const response = await axios.post<{ success: boolean; message: ChatMessageData }>(
                `/classes/${schoolClass.id}/chat/messages`,
                { message: textToSend }
            );

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
            const response = await axios.post<{ success: boolean; pinned_message: ChatMessageData | null }>(
                `/classes/${schoolClass.id}/chat/messages/${messageId}/pin`
            );

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

    const getSenderBadge = (type: string) => {
        switch (type) {
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Admin
                    </span>
                );
            case 'teacher':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        <GraduationCap className="w-3 h-3 text-blue-600" />
                        Giáo viên
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <User className="w-3 h-3 text-slate-500" />
                        Học sinh
                    </span>
                );
        }
    };

    return (
        <AppLayout title={`Nhóm Chat Lớp ${schoolClass.name}`}>
            <Head title={`Nhóm Chat Lớp ${schoolClass.name}`} />

            <div className="max-w-5xl mx-auto space-y-4">
                {/* Back Link */}
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Quay lại Lớp học
                </button>

                <Card className="overflow-hidden flex flex-col h-[750px]">
                    {/* Header */}
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold flex items-center gap-2">
                                    Nhóm Chat Lớp: {schoolClass.name} ({schoolClass.code})
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {schoolClass.center?.name || 'Trung tâm Sam Edu'} • Real-time Redis Chat
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-xs text-slate-300 block">Đăng nhập với tư cách:</span>
                            <span className="text-xs font-semibold text-emerald-400">
                                {currentUser.sender_name} ({currentUser.sender_type.toUpperCase()})
                            </span>
                        </div>
                    </div>

                    {/* Pinned Message Banner */}
                    {pinnedMessage && (
                        <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 text-amber-900 animate-fadeIn">
                            <div className="flex items-start gap-2.5 min-w-0">
                                <Pin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 fill-amber-500" />
                                <div className="text-xs min-w-0">
                                    <div className="font-semibold text-amber-800 flex items-center gap-1.5">
                                        <span>Tin nhắn đã ghim</span>
                                        <span className="text-[10px] text-amber-600 font-normal">
                                            (bởi {pinnedMessage.pinned_by_name || 'Giáo viên/Admin'})
                                        </span>
                                    </div>
                                    <div className="truncate text-gray-800 font-medium mt-0.5">
                                        "{pinnedMessage.message}"
                                    </div>
                                </div>
                            </div>

                            {currentUser.can_pin && (
                                <button
                                    onClick={() => handleTogglePin(pinnedMessage.id)}
                                    title="Bỏ ghim tin nhắn"
                                    className="p-1 hover:bg-amber-100 rounded text-amber-700 hover:text-amber-900 transition-colors shrink-0"
                                >
                                    <PinOff className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Chat Messages Body */}
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                                <MessageSquare className="w-12 h-12 stroke-1 mb-2 text-gray-300" />
                                <p className="text-sm font-medium">Chưa có tin nhắn nào trong nhóm chat này.</p>
                                <p className="text-xs text-gray-400 mt-1">Hãy là người đầu tiên gửi tin nhắn trao đổi!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isSelf =
                                    msg.sender_type === currentUser.sender_type &&
                                    msg.sender_id === currentUser.sender_id;

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-2.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        {/* Avatar */}
                                        <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                                            {msg.sender_name.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Message Bubble Container */}
                                        <div className={`max-w-[70%] space-y-1 ${isSelf ? 'items-end' : 'items-start'}`}>
                                            {/* Author Info & Badge */}
                                            <div
                                                className={`flex items-center gap-2 text-xs ${
                                                    isSelf ? 'justify-end' : 'justify-start'
                                                }`}
                                            >
                                                <span className="font-semibold text-gray-800">{msg.sender_name}</span>
                                                {getSenderBadge(msg.sender_type)}
                                                <span className="text-[10px] text-gray-400">{msg.time_formatted}</span>
                                            </div>

                                            {/* Message Content Bubble */}
                                            <div className="group relative flex items-center gap-2">
                                                <div
                                                    className={`p-3 rounded-2xl text-sm leading-relaxed shadow-xs ${
                                                        isSelf
                                                            ? 'bg-emerald-600 text-white rounded-tr-xs'
                                                            : 'bg-white border border-gray-200 text-gray-900 rounded-tl-xs'
                                                    } ${msg.is_pinned ? 'ring-2 ring-amber-400' : ''}`}
                                                >
                                                    {msg.message}
                                                </div>

                                                {/* Action: Pin Button for Admin/Teacher */}
                                                {currentUser.can_pin && (
                                                    <button
                                                        onClick={() => handleTogglePin(msg.id)}
                                                        title={msg.is_pinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
                                                        className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-gray-200 transition-all ${
                                                            msg.is_pinned ? 'opacity-100 text-amber-600' : 'text-gray-400'
                                                        }`}
                                                    >
                                                        <Pin className={`w-3.5 h-3.5 ${msg.is_pinned ? 'fill-amber-500' : ''}`} />
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
                    <div className="p-3 bg-white border-t border-gray-200">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <Input
                                placeholder="Nhập tin nhắn để trao đổi cùng lớp học..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                className="flex-1 text-sm py-2.5"
                                disabled={isSending}
                            />
                            <Button
                                type="submit"
                                variant="success"
                                disabled={isSending || !inputMessage.trim()}
                                className="px-4 py-2.5 flex items-center gap-1.5"
                            >
                                <Send className="w-4 h-4" />
                                <span>Gửi</span>
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}

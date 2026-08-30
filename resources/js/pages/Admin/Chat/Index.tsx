import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Building2,
    Clock,
    Filter,
    GraduationCap,
    MessageSquare,
    Search,
    Smile,
    Sparkles,
    Users
} from 'lucide-react';
import React, { useState } from 'react';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface ClassOption {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

interface Subject {
    id: number;
    name: string;
    code: string;
}

interface Teacher {
    id: number;
    full_name: string;
    teacher_code: string;
}

interface ClassSubject {
    id: number;
    subject_id: number;
    teacher_id: number;
    subject?: Subject;
    teacher?: Teacher;
}

interface LatestChatMessage {
    id: number;
    class_id: number;
    sender_type: number;
    sender_id: number;
    sender_name: string;
    message: string;
    is_pinned: boolean;
    created_at: string;
}

interface SchoolClassChatGroup {
    id: number;
    center_id: number;
    code: string;
    name: string;
    description: string | null;
    max_students: number | null;
    start_date: string | null;
    end_date: string | null;
    status: number;
    students_count?: number;
    chat_messages_count?: number;
    center?: Center;
    class_subjects?: ClassSubject[];
    latest_chat_message?: LatestChatMessage | null;
    created_at?: string;
    updated_at?: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    chatGroups: PaginatedData<SchoolClassChatGroup>;
    centers: Center[];
    classes: ClassOption[];
    filters: {
        search?: string;
        center_id?: number | null;
        class_id?: number | null;
        status?: number;
        per_page?: number;
    };
    isSuperAdmin?: boolean;
}

export default function ChatGroupIndex({
    chatGroups,
    centers = [],
    classes = [],
    filters,
    isSuperAdmin = false,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<number>(
        filters.center_id ? Number(filters.center_id) : 0,
    );
    const [selectedClassId, setSelectedClassId] = useState<number>(
        filters.class_id ? Number(filters.class_id) : 0,
    );
    const [selectedStatus, setSelectedStatus] = useState<number>(
        filters.status !== undefined && filters.status !== null ? Number(filters.status) : 1,
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/chats',
            {
                search: search || undefined,
                center_id: selectedCenterId ? Number(selectedCenterId) : undefined,
                class_id: selectedClassId ? Number(selectedClassId) : undefined,
                status: selectedStatus ? Number(selectedStatus) : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId(0);
        setSelectedClassId(0);
        setSelectedStatus(0);
        router.get(
            '/chats',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const renderStatusBadge = (status: number) => {
        switch (status) {
            case 1:
                return <Badge variant="active">Đang học</Badge>;
            case 2:
                return <Badge variant="pending">Tạm ngưng</Badge>;
            case 3:
                return <Badge variant="expired">Hoàn thành</Badge>;
            case 4:
                return <Badge variant="info">Đã đóng</Badge>;
            default:
                return <Badge variant="info">Khác</Badge>;
        }
    };

    const formatMessageTime = (dateString?: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const isToday =
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();

            const timeStr = date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
            });

            if (isToday) {
                return timeStr;
            }

            const dateStr = date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
            });
            return `${timeStr}, ${dateStr}`;
        } catch {
            return dateString;
        }
    };

    return (
        <AppLayout title="Nhóm Chat Lớp Học">
            <Head title="Nhóm Chat Lớp Học" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                                    Nhóm Chat Lớp Học
                                </h1>
                                <p className="text-xs text-gray-500 sm:text-sm">
                                    Trao đổi, giải đáp bài tập và cập nhật thông tin học tập theo từng lớp học
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Search Keyword */}
                            <div className={isSuperAdmin && centers.length > 1 ? 'lg:col-span-1' : 'lg:col-span-2'}>
                                <Input
                                    placeholder="Tìm theo tên lớp, mã lớp, môn học, giáo viên..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    icon={<Search className="h-4.5 w-4.5 text-gray-400" />}
                                    className="!py-2.5 !text-sm"
                                />
                            </div>

                            {/* Class Selector Dropdown */}
                            <div>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="0">Tất cả Lớp học</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Center Selector (Super Admin Only) */}
                            {isSuperAdmin && centers && centers.length > 1 && (
                                <div>
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => setSelectedCenterId(Number(e.target.value))}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="0">Tất cả Trung tâm</option>
                                        {centers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Status Selector */}
                            <div>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="0">Tất cả Trạng thái</option>
                                    <option value="1">Đang học</option>
                                    <option value="2">Tạm ngưng</option>
                                    <option value="3">Đã hoàn thành</option>
                                    <option value="4">Đã đóng</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                            <span className="text-xs text-gray-500">
                                Tìm thấy <strong className="text-gray-900">{chatGroups.total}</strong> nhóm chat lớp học
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="md"
                                    onClick={handleResetFilter}
                                >
                                    Đặt lại
                                </Button>
                                <Button
                                    type="submit"
                                    variant="success"
                                    size="md"
                                    icon={<Filter className="h-4 w-4" />}
                                >
                                    Lọc dữ liệu
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Chat Groups Grid */}
                {chatGroups.data.length === 0 ? (
                    <Card className="border-dashed border-gray-300 bg-white p-12 text-center shadow-xs">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
                            <Smile className="h-8 w-8" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">
                            Không tìm thấy nhóm chat nào
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                            Không có nhóm chat lớp học nào phù hợp với điều kiện tìm kiếm của bạn hoặc bạn chưa được phân công vào lớp học nào.
                        </p>
                        <div className="mt-5">
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={handleResetFilter}
                            >
                                Xóa bộ lọc tìm kiếm
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {chatGroups.data.map((group) => {
                            const teacherNames = group.class_subjects
                                ?.map((cs) => cs.teacher?.full_name)
                                .filter(Boolean)
                                .join(', ');

                            const subjectNames = group.class_subjects
                                ?.map((cs) => cs.subject?.name)
                                .filter(Boolean)
                                .join(', ');

                            const lastMsg = group.latest_chat_message;

                            return (
                                <Card
                                    key={group.id}
                                    className="group relative flex flex-col justify-between overflow-hidden border border-gray-200/90 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md rounded-2xl"
                                >
                                    {/* Top Accent Stripe */}
                                    <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600" />

                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        {/* Header: Class Name, Code & Status */}
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/70">
                                                            {group.code}
                                                        </span>
                                                        {renderStatusBadge(group.status)}
                                                    </div>
                                                    <h3 className="mt-2 text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                                                        {group.name}
                                                    </h3>
                                                </div>

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 font-bold text-white shadow-2xs">
                                                    {group.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>

                                            {/* Center Name for Super Admin */}
                                            {isSuperAdmin && group.center && (
                                                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                                    <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                    <span className="truncate">{group.center.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta info tags */}
                                        <div className="space-y-2 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                                            {subjectNames && (
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                    <span className="font-semibold text-gray-700">Môn học:</span>
                                                    <span className="truncate text-gray-900">{subjectNames}</span>
                                                </div>
                                            )}

                                            {teacherNames && (
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                                    <span className="font-semibold text-gray-700">Giáo viên:</span>
                                                    <span className="truncate text-gray-900">{teacherNames}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-2xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5 text-gray-400" />
                                                    <span><strong>{group.students_count ?? 0}</strong> học sinh</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                                                    <span><strong>{group.chat_messages_count ?? 0}</strong> tin nhắn</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Latest Message Preview Bubble */}
                                        <div className="rounded-xl border border-gray-200/80 bg-white p-3 shadow-2xs">
                                            <div className="flex items-center justify-between text-2xs text-gray-400 mb-1">
                                                <span className="font-semibold text-gray-600 flex items-center gap-1">
                                                    <Sparkles className="h-3 w-3 text-amber-500" />
                                                    Tin nhắn gần nhất
                                                </span>
                                                {lastMsg?.created_at && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatMessageTime(lastMsg.created_at)}
                                                    </span>
                                                )}
                                            </div>

                                            {lastMsg ? (
                                                <div className="text-xs">
                                                    <span className="font-bold text-gray-800">
                                                        {lastMsg.sender_name}:
                                                    </span>{' '}
                                                    <span className="text-gray-600 line-clamp-2">
                                                        {lastMsg.message}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-xs italic text-gray-400">
                                                    Chưa có tin nhắn nào. Bấm vào để bắt đầu cuộc trò chuyện!
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footer Button */}
                                    <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                                        <Link
                                            href={`/classes/${group.id}/chat`}
                                            className="block w-full"
                                        >
                                            <Button
                                                variant="success"
                                                size="md"
                                                className="w-full justify-center shadow-xs group-hover:bg-emerald-700"
                                            >
                                                <span>Vào Trò Chuyện</span>
                                                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {chatGroups.links && chatGroups.links.length > 1 && (
                    <div className="mt-6">
                        <Pagination
                            links={chatGroups.links}
                            from={chatGroups.from}
                            to={chatGroups.to}
                            total={chatGroups.total}
                            currentParams={{
                                search,
                                center_id: selectedCenterId,
                                class_id: selectedClassId,
                                status: selectedStatus,
                            }}
                        />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertCircle,
    Filter,
    DoorOpen,
    Eye,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';

import { usePermission } from '@/hooks/usePermission';
interface Center {
    id: number;
    name: string;
    code: string;
}

interface SchoolClass {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

interface Subject {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

interface Teacher {
    id: number;
    full_name: string;
    teacher_code: string;
    center_id: number;
}

interface Room {
    id: number;
    name: string;
}

interface ClassSession {
    id: number;
    session_date: string;
    start_time: string;
    end_time: string;
    status: string;
    topic: string | null;
}

interface ClassSchedule {
    id: number;
    class_subject_id: number;
    weeks: Record<string, [string, string][]>;
    off_days?: { date: string; start_time?: string | null; end_time?: string | null }[] | null;
    extra_days?: { date: string; start_time: string; end_time: string }[] | null;
    room_id: number | null;
    status: string;
    class_sessions_count?: number;
    room?: Room;
    class_subject?: {
        id: number;
        start_date?: string;
        end_date?: string | null;
        school_class?: {
            id: number;
            name: string;
            code: string;
            center?: Center;
        };
        subject?: {
            id: number;
            name: string;
            code: string;
        };
        teacher?: {
            id: number;
            full_name: string;
            teacher_code: string;
        };
        class_sessions_count?: number;
    };
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    schedules: PaginatedData<ClassSchedule>;
    centers: Center[];
    classes: SchoolClass[];
    subjects: Subject[];
    teachers: Teacher[];
    filters: {
        search?: string;
        center_id?: number | null;
        class_id?: number | null;
        subject_id?: number | null;
        teacher_id?: number | null;
        status?: string;
    };
}

export default function ScheduleIndex({
    schedules,
    centers = [],
    classes = [],
    subjects = [],
    filters,
}: Props) {
    const { can } = usePermission();
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(
        filters.center_id ? String(filters.center_id) : '',
    );
    const [selectedClassId, setSelectedClassId] = useState<string>(
        filters.class_id ? String(filters.class_id) : '',
    );
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
        filters.subject_id ? String(filters.subject_id) : '',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.status || 'all',
    );

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingSchedule, setDeletingSchedule] = useState<ClassSchedule | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // View sessions modal state
    const [sessionModalOpen, setSessionModalOpen] = useState(false);
    const [viewingSchedule, setViewingSchedule] = useState<ClassSchedule | null>(null);
    const [sessionsList, setSessionsList] = useState<ClassSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/schedules',
            {
                search: search || undefined,
                center_id: selectedCenterId || undefined,
                class_id: selectedClassId || undefined,
                subject_id: selectedSubjectId || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId('');
        setSelectedClassId('');
        setSelectedSubjectId('');
        setSelectedStatus('all');
        router.get('/schedules', {}, { preserveState: true });
    };

    const openDeleteModal = (sch: ClassSchedule) => {
        setDeletingSchedule(sch);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingSchedule) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/schedules/${deletingSchedule.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingSchedule(null);
            },
        });
    };

    const handleViewSessions = async (sch: ClassSchedule) => {
        setViewingSchedule(sch);
        setSessionModalOpen(true);
        setIsLoadingSessions(true);

        try {
            const res = await fetch(`/schedules/${sch.id}/sessions`);
            const data = await res.json();
            setSessionsList(data.sessions || []);
        } catch (e) {
            console.error('Error fetching sessions:', e);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const getWeekdayLabel = (weekday: number) => {
        switch (weekday) {
            case 1:
                return 'Thứ 2';
            case 2:
                return 'Thứ 3';
            case 3:
                return 'Thứ 4';
            case 4:
                return 'Thứ 5';
            case 5:
                return 'Thứ 6';
            case 6:
                return 'Thứ 7';
            case 7:
                return 'Chủ Nhật';
            default:
                return `T${weekday}`;
        }
    };

    return (
        <AppLayout title="Quản Lý Lịch Học - Hệ Thống Giáo Dục Sam">
            <Head title="Quản Lý Lịch Học" />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <Calendar className="h-7 w-7 text-emerald-600" />
                            Quản Lý Lịch Học
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Cấu hình lịch học các môn theo lớp, thiết lập ngày nghỉ lễ Việt Nam và tự động sinh các ca học thực tế.
                        </p>
                    </div>

                    {can('schedules.create') && (
                        <Link href="/schedules/create">
                            <Button
                                variant="success"
                                size="md"
                                icon={<Plus className="h-4.5 w-4.5" />}
                            >
                                Tạo Lịch Học Mới
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="lg:col-span-2">
                                <Input
                                    placeholder="Tìm theo tên lớp, môn học, giáo viên, phòng..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    icon={<Search className="h-5 w-5 text-gray-400" />}
                                    className="!py-2.5 !text-sm"
                                />
                            </div>

                            {isSuperAdmin && centers && centers.length > 1 && (
                                <div>
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => setSelectedCenterId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">Tất cả Trung tâm</option>
                                        {centers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {classes && classes.length > 0 && (
                                <div>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">Tất cả Lớp học</option>
                                        {classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name} ({cls.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {subjects && subjects.length > 0 && (
                                <div>
                                    <select
                                        value={selectedSubjectId}
                                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">Tất cả Môn học</option>
                                        {subjects.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name} ({sub.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">Tất cả Trạng thái</option>
                                    <option value="active">Đang áp dụng</option>
                                    <option value="inactive">Tạm dừng</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-1">
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
                                Lọc Dữ Liệu
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Main Schedules Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    {
                                        isSuperAdmin ? (
                                            <th className="px-6 py-4">Lớp Học & Trung Tâm</th>
                                        ) : (
                                            <></>
                                        )
                                    }
                                    <th className="px-6 py-4">Môn Học</th>
                                    <th className="px-6 py-4">Giáo Viên & Phòng Học</th>
                                    <th className="px-6 py-4">Lịch Định Kỳ Trong Tuần</th>
                                    <th className="px-6 py-4">Thời Gian Áp Dụng</th>
                                    <th className="px-6 py-4">Ca Học Đã Sinh</th>
                                    <th className="px-6 py-4">Trạng Thái</th>
                                    {(can('schedules.edit') || can('schedules.delete')) && (
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {schedules.data && schedules.data.length > 0 ? (
                                    schedules.data.map((sch) => (
                                        <tr
                                            key={sch.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            {
                                                isSuperAdmin ? (
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-900">
                                                            {sch.class_subject?.school_class?.name || 'N/A'}
                                                        </div>
                                                        <div className="mt-0.5 font-mono text-xs text-gray-400">
                                                            {sch.class_subject?.school_class?.code} • {sch.class_subject?.school_class?.center?.name}
                                                        </div>
                                                    </td>
                                                ) : (
                                                    <></>
                                                )
                                            }

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-emerald-800">
                                                    {sch.class_subject?.subject?.name || 'Môn học'}
                                                </div>
                                                <div className="font-mono text-xs text-gray-400">
                                                    {sch.class_subject?.subject?.code}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">
                                                    GV {sch.class_subject?.teacher?.full_name || 'Chưa gán'}
                                                </div>
                                                <div className="mt-0.5 text-xs text-gray-500 flex items-center gap-1">
                                                    <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
                                                    {sch.room?.name || 'Chưa chọn phòng'}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                    {sch.weeks && Object.keys(sch.weeks).length > 0 ? (
                                                        Object.entries(sch.weeks).map(([dayKey, slots]) => {
                                                            if (!Array.isArray(slots) || slots.length === 0) return null;
                                                            return (
                                                                <div
                                                                    key={dayKey}
                                                                    className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                                                                >
                                                                    <span className="font-bold">{getWeekdayLabel(Number(dayKey))}:</span>
                                                                    <span className="font-mono">
                                                                        {slots.map((s: any) => {
                                                                            const start = Array.isArray(s) ? s[0] : (s?.start_time || s?.start || '');
                                                                            const end = Array.isArray(s) ? s[1] : (s?.end_time || s?.end || '');
                                                                            return `${String(start).slice(0, 5)} - ${String(end).slice(0, 5)}`;
                                                                        }).join(', ')}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Chưa đặt lịch tuần</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                                                <div>Từ: {sch.class_subject?.start_date || 'N/A'}</div>
                                                {sch.class_subject?.end_date && <div>Đến: {sch.class_subject.end_date}</div>}
                                            </td>

                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleViewSessions(sch)}
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-slate-200 transition-colors"
                                                    title="Xem chi tiết các ca học"
                                                >
                                                    <Eye className="h-4 w-4 text-blue-600" />
                                                    {sch.class_subject?.class_sessions_count ?? sch.class_sessions_count ?? 0} ca học
                                                </button>
                                            </td>

                                            <td className="px-6 py-4">
                                                {sch.status === 'active' ? (
                                                    <Badge variant="active">Đang áp dụng</Badge>
                                                ) : (
                                                    <Badge variant="expired">Tạm dừng</Badge>
                                                )}
                                            </td>

                                            {(can('schedules.edit') || can('schedules.delete')) && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {can('schedules.edit') && (
                                                            <Link href={`/schedules/${sch.id}/edit`}>
                                                                <Button
                                                                    variant="edit"
                                                                    size="sm"
                                                                    icon={<Edit2 className="h-4 w-4" />}
                                                                    title="Sửa lịch học"
                                                                >
                                                                    Sửa
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can('schedules.delete') && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                icon={<Trash2 className="h-4 w-4" />}
                                                                onClick={() => openDeleteModal(sch)}
                                                                title="Xóa lịch học"
                                                            >
                                                                Xóa
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={(isSuperAdmin ? 1 : 0) + 6 + (can('schedules.edit') || can('schedules.delete') ? 1 : 0)}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <Calendar className="h-10 w-10 text-gray-300" />
                                                <p className="text-base font-semibold text-gray-700">
                                                    Không tìm thấy lịch học nào phù hợp
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Thử thay đổi bộ lọc hoặc thiết lập lịch học mới cho lớp.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {schedules.links && schedules.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 text-sm text-gray-600">
                            <div>
                                Hiển thị trang <strong>{schedules.current_page}</strong> / {schedules.last_page} (Tổng {schedules.total} lịch học)
                            </div>
                            <div className="flex gap-1.5">
                                {schedules.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors ${link.active
                                            ? 'bg-emerald-600 text-white'
                                            : link.url
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'cursor-not-allowed text-gray-400 opacity-50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* View Sessions List Modal */}
            <Modal
                isOpen={sessionModalOpen}
                onClose={() => {
                    setSessionModalOpen(false);
                    setViewingSchedule(null);
                    setSessionsList([]);
                }}
                title={`Danh Sách Ca Học Đã Sinh (${sessionsList.length} ca)`}
                footer={
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                            setSessionModalOpen(false);
                            setViewingSchedule(null);
                            setSessionsList([]);
                        }}
                    >
                        Đóng
                    </Button>
                }
            >
                <div className="space-y-4">
                    <div className="rounded-lg bg-slate-50 p-3.5 text-sm text-gray-700">
                        <div>
                            <strong>Lớp:</strong> {viewingSchedule?.class_subject?.school_class?.name}
                        </div>
                        <div>
                            <strong>Môn học:</strong> {viewingSchedule?.class_subject?.subject?.name}
                        </div>
                        <div>
                            <strong>Giáo viên:</strong> GV {viewingSchedule?.class_subject?.teacher?.full_name}
                        </div>
                    </div>

                    {isLoadingSessions ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                            Đang tải danh sách ca học...
                        </div>
                    ) : sessionsList.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-200">
                            {sessionsList.map((ses, idx) => (
                                <div
                                    key={ses.id}
                                    className="flex items-center justify-between p-3 text-sm hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <span className="font-semibold text-gray-900 font-mono">
                                                {ses.session_date}
                                            </span>
                                            {ses.topic && (
                                                <span className="ml-2 text-gray-500 italic">
                                                    ({ses.topic})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-gray-600">
                                            {ses.start_time ? String(ses.start_time).slice(0, 5) : '--:--'} - {ses.end_time ? String(ses.end_time).slice(0, 5) : '--:--'}
                                        </span>
                                        <Badge variant={ses.status === 'scheduled' ? 'active' : 'info'}>
                                            {ses.status === 'scheduled' ? 'Đã lên lịch' : ses.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-4 text-center text-sm text-gray-400">
                            Chưa có ca học nào được sinh ra.
                        </p>
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Xác Nhận Xóa Lịch Học"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            onClick={confirmDelete}
                            isLoading={isDeleting}
                            icon={<Trash2 className="h-5 w-5" />}
                        >
                            Xác Nhận Xóa
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="h-6 w-6 shrink-0" />
                        <p className="text-base font-semibold">
                            Bạn có chắc chắn muốn xóa lịch học này?
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Lịch học và các ca học chưa diễn ra tương ứng sẽ bị hủy và xóa khỏi hệ thống.
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
}

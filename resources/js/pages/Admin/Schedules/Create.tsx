import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    Clock,
    GraduationCap,
    Plus,
    Trash2,
    CheckSquare,
    Square,
    Coffee,
    CalendarPlus,
    Sparkles,
    Calendar,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';

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
    class_subjects?: {
        id: number;
        subject?: { id: number; name: string; code: string };
        teacher?: { id: number; full_name: string; teacher_code: string };
    }[];
}

interface Subject {
    id: number;
    name: string;
    code: string;
    center_id: number;
    total_sessions?: number | null;
    duration_minutes?: number | null;
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
    center_id: number;
}

interface CreateProps {
    centers: Center[];
    classes: SchoolClass[];
    subjects: Subject[];
    teachers: Teacher[];
    rooms: Room[];
    errors?: Record<string, string>;
}

interface WeekDaySlot {
    start_time: string;
    end_time: string;
}

interface OffDayItem {
    date: string;
    is_full_day: boolean;
    start_time?: string;
    end_time?: string;
    reason?: string;
}

interface ExtraDayItem {
    date: string;
    start_time: string;
    end_time: string;
}

interface VNHoliday {
    date: string;
    name: string;
}

const WEEKDAYS = [
    { id: 1, label: 'Thứ 2' },
    { id: 2, label: 'Thứ 3' },
    { id: 3, label: 'Thứ 4' },
    { id: 4, label: 'Thứ 5' },
    { id: 5, label: 'Thứ 6' },
    { id: 6, label: 'Thứ 7' },
    { id: 7, label: 'Chủ Nhật' },
];

function calculateEstimatedEndDate(
    startDateStr: string,
    weeklyTimes: Record<number, { enabled: boolean; slots: WeekDaySlot[] }>,
    totalSessions: number,
    offDays: OffDayItem[]
): string | null {
    if (!startDateStr || !totalSessions || totalSessions <= 0) {
        return null;
    }

    const enabledDays = Object.entries(weeklyTimes)
        .filter(([, conf]) => conf.enabled && conf.slots.length > 0)
        .map(([day]) => Number(day));

    if (enabledDays.length === 0) {
        return null;
    }

    const fullOffDatesSet = new Set(offDays.filter((s) => s.is_full_day && s.date).map((s) => s.date));

    let createdCount = 0;
    const curr = new Date(startDateStr);
    let lastDate: string | null = null;
    let loopGuard = 0;

    while (createdCount < totalSessions && loopGuard < 1500) {
        loopGuard++;
        const ymd = curr.toISOString().split('T')[0];
        const jsDay = curr.getDay();
        const isoDay = jsDay === 0 ? 7 : jsDay;

        if (enabledDays.includes(isoDay) && !fullOffDatesSet.has(ymd)) {
            const slots = weeklyTimes[isoDay]?.slots || [];
            for (const slot of slots) {
                const isSlotOff = offDays.some(
                    (o) => !o.is_full_day && o.date === ymd && o.start_time === slot.start_time
                );
                if (!isSlotOff) {
                    createdCount++;
                    lastDate = ymd;
                    if (createdCount >= totalSessions) {
                        break;
                    }
                }
            }
        }

        if (createdCount >= totalSessions) {
            break;
        }

        curr.setDate(curr.getDate() + 1);
    }

    return lastDate;
}

export default function ScheduleCreate({
    classes = [],
    subjects = [],
    teachers = [],
    rooms = [],
    errors = {},
}: CreateProps) {
    const initialClass = classes[0];

    const [selectedClassId, setSelectedClassId] = useState<string>(
        initialClass?.id ? String(initialClass.id) : '',
    );
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>('');
    const [status] = useState<string>('active');

    // Weekly schedules: Map of weekday -> { enabled: boolean, slots: [{start_time, end_time}] }
    const [weeklyTimes, setWeeklyTimes] = useState<
        Record<number, { enabled: boolean; slots: WeekDaySlot[] }>
    >({
        1: { enabled: true, slots: [{ start_time: '18:00', end_time: '20:00' }] },
        2: { enabled: false, slots: [{ start_time: '18:00', end_time: '20:00' }] },
        3: { enabled: true, slots: [{ start_time: '18:00', end_time: '20:00' }] },
        4: { enabled: false, slots: [{ start_time: '18:00', end_time: '20:00' }] },
        5: { enabled: true, slots: [{ start_time: '18:00', end_time: '20:00' }] },
        6: { enabled: false, slots: [{ start_time: '08:00', end_time: '10:00' }] },
        7: { enabled: false, slots: [{ start_time: '08:00', end_time: '10:00' }] },
    });

    // Off days (full-day or partial slot)
    const [offDays, setOffDays] = useState<OffDayItem[]>([]);

    // Extra days (make-up sessions)
    const [extraDays, setExtraDays] = useState<ExtraDayItem[]>([]);

    // Holiday picker modal state
    const [showHolidayModal, setShowHolidayModal] = useState<boolean>(false);
    const [availableHolidays, setAvailableHolidays] = useState<VNHoliday[]>([]);
    const [selectedHolidayDates, setSelectedHolidayDates] = useState<Set<string>>(new Set());
    const [isLoadingHolidays, setIsLoadingHolidays] = useState<boolean>(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentClass = classes.find((c) => String(c.id) === String(selectedClassId));
    const centerId = currentClass ? Number(currentClass.center_id) : null;

    const displaySubjects = React.useMemo(() => {
        const list: Subject[] = [];
        const seenIds = new Set<number>();

        if (currentClass?.class_subjects) {
            for (const cs of currentClass.class_subjects) {
                if (cs.subject && !seenIds.has(cs.subject.id)) {
                    seenIds.add(cs.subject.id);
                    const fullSub = subjects.find((s) => s.id === cs.subject?.id);
                    list.push(fullSub || {
                        id: cs.subject.id,
                        name: cs.subject.name,
                        code: cs.subject.code,
                        center_id: centerId || 0,
                    });
                }
            }
        }

        const centerSubjects = subjects.filter((s) => !centerId || Number(s.center_id) === centerId);
        for (const s of centerSubjects) {
            if (!seenIds.has(s.id)) {
                seenIds.add(s.id);
                list.push(s);
            }
        }

        return list.length > 0 ? list : subjects;
    }, [currentClass, centerId, subjects]);

    const displayTeachers = React.useMemo(() => {
        const list: Teacher[] = [];
        const seenIds = new Set<number>();

        if (currentClass?.class_subjects) {
            for (const cs of currentClass.class_subjects) {
                if (cs.teacher && !seenIds.has(cs.teacher.id)) {
                    seenIds.add(cs.teacher.id);
                    list.push({
                        id: cs.teacher.id,
                        full_name: cs.teacher.full_name,
                        teacher_code: cs.teacher.teacher_code,
                        center_id: centerId || 0,
                    });
                }
            }
        }

        const centerTeachers = teachers.filter((t) => !centerId || Number(t.center_id) === centerId);
        for (const t of centerTeachers) {
            if (!seenIds.has(t.id)) {
                seenIds.add(t.id);
                list.push(t);
            }
        }

        return list.length > 0 ? list : teachers;
    }, [currentClass, centerId, teachers]);

    const displayRooms = React.useMemo(() => {
        const centerRooms = rooms.filter((r) => !centerId || Number(r.center_id) === centerId);
        return centerRooms.length > 0 ? centerRooms : rooms;
    }, [centerId, rooms]);

    const currentSubject = displaySubjects.find((s) => String(s.id) === String(selectedSubjectId));
    const totalSessions = currentSubject?.total_sessions;
    const activeSlotsCount = Object.values(weeklyTimes)
        .filter((w) => w.enabled)
        .reduce((sum, w) => sum + w.slots.length, 0);

    const estimatedEndDate = React.useMemo(() => {
        if (!totalSessions || !startDate) {
            return null;
        }
        return calculateEstimatedEndDate(startDate, weeklyTimes, totalSessions, offDays);
    }, [startDate, weeklyTimes, totalSessions, offDays]);

    const handleClassChange = (newClassId: string) => {
        setSelectedClassId(newClassId);
        setSelectedSubjectId('');
        setSelectedTeacherId('');
    };

    const handleSubjectChange = (newSubjectId: string) => {
        setSelectedSubjectId(newSubjectId);
        if (!newSubjectId) {
            setSelectedTeacherId('');
            return;
        }

        const matchedCs = currentClass?.class_subjects?.find(
            (cs) => String(cs.subject?.id) === String(newSubjectId)
        );
        if (matchedCs?.teacher?.id) {
            setSelectedTeacherId(String(matchedCs.teacher.id));
        }
    };

    const toggleWeekday = (day: number) => {
        setWeeklyTimes((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                enabled: !prev[day].enabled,
            },
        }));
    };

    const handleSlotChange = (day: number, slotIdx: number, field: 'start_time' | 'end_time', val: string) => {
        setWeeklyTimes((prev) => {
            const dayConf = prev[day];
            const updatedSlots = [...dayConf.slots];
            updatedSlots[slotIdx] = { ...updatedSlots[slotIdx], [field]: val };
            return {
                ...prev,
                [day]: { ...dayConf, slots: updatedSlots },
            };
        });
    };

    const handleAddSlot = (day: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setWeeklyTimes((prev) => {
            const dayConf = prev[day];
            return {
                ...prev,
                [day]: {
                    ...dayConf,
                    slots: [...dayConf.slots, { start_time: '08:00', end_time: '10:00' }],
                },
            };
        });
    };

    const handleRemoveSlot = (day: number, slotIdx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setWeeklyTimes((prev) => {
            const dayConf = prev[day];
            if (dayConf.slots.length <= 1) {
                return prev;
            }
            return {
                ...prev,
                [day]: {
                    ...dayConf,
                    slots: dayConf.slots.filter((_, idx) => idx !== slotIdx),
                },
            };
        });
    };

    // Off days handlers
    const handleAddOffDay = () => {
        setOffDays([
            ...offDays,
            {
                date: new Date().toISOString().split('T')[0],
                is_full_day: true,
                start_time: '18:00',
                end_time: '20:00',
                reason: 'Nghỉ theo lịch',
            },
        ]);
    };

    const handleRemoveOffDay = (index: number) => {
        setOffDays(offDays.filter((_, idx) => idx !== index));
    };

    const handleOffDayChange = (index: number, field: keyof OffDayItem, val: any) => {
        const updated = [...offDays];
        updated[index] = { ...updated[index], [field]: val };
        setOffDays(updated);
    };

    // Extra days handlers
    const handleAddExtraDay = () => {
        setExtraDays([
            ...extraDays,
            {
                date: new Date().toISOString().split('T')[0],
                start_time: '08:00',
                end_time: '10:00',
            },
        ]);
    };

    const handleRemoveExtraDay = (index: number) => {
        setExtraDays(extraDays.filter((_, idx) => idx !== index));
    };

    const handleExtraDayChange = (index: number, field: keyof ExtraDayItem, val: string) => {
        const updated = [...extraDays];
        updated[index] = { ...updated[index], [field]: val };
        setExtraDays(updated);
    };

    // Fetch VN Holidays from API
    const handleOpenHolidayModal = async () => {
        setShowHolidayModal(true);
        setIsLoadingHolidays(true);
        try {
            const year = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
            const res = await fetch(`/api/vietnam-holidays?year=${year}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableHolidays(data.holidays || []);
                // Pre-select holidays that are already in offDays
                const existing = new Set(offDays.filter((o) => o.is_full_day).map((o) => o.date));
                setSelectedHolidayDates(existing);
            }
        } catch (err) {
            console.error('Lỗi khi tải ngày lễ:', err);
        } finally {
            setIsLoadingHolidays(false);
        }
    };

    const handleToggleHolidaySelection = (date: string) => {
        const next = new Set(selectedHolidayDates);
        if (next.has(date)) {
            next.delete(date);
        } else {
            next.add(date);
        }
        setSelectedHolidayDates(next);
    };

    const handleApplyHolidays = () => {
        // Keep non-holiday custom off days
        const holidayDatesMap = new Map(availableHolidays.map((h) => [h.date, h.name]));
        const nonHolidays = offDays.filter((o) => !holidayDatesMap.has(o.date));

        const newHolidaysOff: OffDayItem[] = Array.from(selectedHolidayDates).map((date) => ({
            date,
            is_full_day: true,
            reason: holidayDatesMap.get(date) || 'Nghỉ Lễ Việt Nam',
        }));

        setOffDays([...nonHolidays, ...newHolidaysOff]);
        setShowHolidayModal(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const weeksPayload: Record<string, [string, string][]> = {};
        Object.entries(weeklyTimes).forEach(([dayStr, conf]) => {
            if (conf.enabled && conf.slots.length > 0) {
                weeksPayload[dayStr] = conf.slots.map((s) => [s.start_time, s.end_time]);
            }
        });

        const offDaysPayload = offDays.map((o) => ({
            date: o.date,
            start_time: o.is_full_day ? null : o.start_time || null,
            end_time: o.is_full_day ? null : o.end_time || null,
        }));

        const extraDaysPayload = extraDays.map((e) => ({
            date: e.date,
            start_time: e.start_time,
            end_time: e.end_time,
        }));

        router.post(
            '/schedules',
            {
                class_id: Number(selectedClassId),
                subject_id: Number(selectedSubjectId),
                teacher_id: Number(selectedTeacherId),
                room_id: selectedRoomId ? Number(selectedRoomId) : null,
                start_date: startDate,
                end_date: endDate || null,
                weeks: weeksPayload,
                off_days: offDaysPayload,
                extra_days: extraDaysPayload,
                status,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Thiết Lập Lịch Học Mới - Hệ Thống Giáo Dục Sam">
            <Head title="Thiết Lập Lịch Học Mới" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/schedules">
                            <Button variant="secondary" size="md" icon={<ArrowLeft className="h-5 w-5" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Thiết Lập Lịch Học Mới</h1>
                            <p className="text-sm text-gray-500">
                                Đặt lịch định kỳ theo thứ, hỗ trợ nhiều ca/ngày, cấu hình ngày nghỉ linh hoạt và tự động sinh ca học.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Thông tin Lớp & Môn Học */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-5 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <GraduationCap className="h-5 w-5 text-emerald-600" />
                            1. Thông Tin Lớp Học & Môn Học
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                            {/* Class Selection */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Lớp Học <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => handleClassChange(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">-- Chọn Lớp Học --</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.class_id && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.class_id}</p>
                                )}
                            </div>

                            {/* Subject Selection */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Môn Học <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => handleSubjectChange(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">-- Chọn Môn Học --</option>
                                    {displaySubjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code}){s.total_sessions ? ` - ${s.total_sessions} buổi` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.subject_id && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.subject_id}</p>
                                )}
                            </div>

                            {/* Teacher Selection */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Giáo Viên Giảng Dạy <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">-- Chọn Giáo Viên --</option>
                                    {displayTeachers.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.full_name} ({t.teacher_code})
                                        </option>
                                    ))}
                                </select>
                                {errors.teacher_id && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.teacher_id}</p>
                                )}
                            </div>

                            {/* Room Selection */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Phòng Học (Tùy chọn)
                                </label>
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">-- Chưa Chọn Phòng (Online / Linh hoạt) --</option>
                                    {displayRooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Bắt Đầu Môn Học <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {errors.start_date && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.start_date}</p>
                                )}
                            </div>

                            {/* End Date */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-800">
                                        Ngày Kết Thúc (Dự kiến)
                                    </label>
                                    {totalSessions && totalSessions > 0 && !endDate && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                            ✨ Tự động theo {totalSessions} buổi
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="!py-3 !text-sm"
                                    />
                                    {endDate && (
                                        <button
                                            type="button"
                                            onClick={() => setEndDate('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                                            title="Xóa ngày cố định để hệ thống tự động tính theo số buổi"
                                        >
                                            Xóa (Tự động tính)
                                        </button>
                                    )}
                                </div>
                                {totalSessions && totalSessions > 0 ? (
                                    <div className="mt-1.5 text-xs">
                                        {endDate ? (
                                            <span className="text-gray-500">
                                                Đang đặt ngày kết thúc cố định. (Nếu để trống, sinh đúng <strong>{totalSessions} buổi</strong> dự kiến đến <strong>{estimatedEndDate || '...'}</strong>).
                                            </span>
                                        ) : (
                                            <span className="font-medium text-emerald-700">
                                                Môn học gồm <strong>{totalSessions} buổi</strong>. Tự động tính ngày kết thúc là <strong>{estimatedEndDate || '...'}</strong>.
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-1.5 text-xs text-gray-400">
                                        (Tùy chọn) Để trống sẽ tự động tạo lịch trong 12 tuần.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Section 2: Lịch Học Định Kỳ Hàng Tuần (T2 .. CN) */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-2 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <Clock className="h-5 w-5 text-blue-600" />
                            2. Lịch Học Định Kỳ Trong Tuần (T2 đến CN, hỗ trợ nhiều ca/ngày)
                        </h2>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
                            <p>
                                Chọn các thứ học trong tuần và thiết lập khung giờ. Mỗi ngày có thể thêm nhiều ca học.
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                    Tổng cộng: <strong className="text-emerald-700">{activeSlotsCount} ca học/tuần</strong>
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {WEEKDAYS.map((day) => {
                                const conf = weeklyTimes[day.id];

                                return (
                                    <div
                                        key={day.id}
                                        onClick={() => toggleWeekday(day.id)}
                                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                            conf.enabled
                                                ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                                                : 'border-gray-200 bg-white opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-900">
                                                {day.label}
                                            </span>
                                            {conf.enabled ? (
                                                <CheckSquare className="h-5 w-5 text-emerald-600" />
                                            ) : (
                                                <Square className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>

                                        {conf.enabled && (
                                            <div
                                                className="mt-3.5 space-y-3"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {conf.slots.map((slot, sIdx) => (
                                                    <div key={sIdx} className="rounded-lg bg-white p-2.5 shadow-xs border border-emerald-200/80">
                                                        <div className="flex items-center justify-between mb-1.5 text-[11px] font-semibold text-emerald-800">
                                                            <span>Ca {sIdx + 1}</span>
                                                            {conf.slots.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleRemoveSlot(day.id, sIdx, e)}
                                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                                    title="Xóa ca này"
                                                                >
                                                                    Xóa ca
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="mb-1 block text-[10px] text-gray-500">Bắt đầu</label>
                                                                <input
                                                                    type="time"
                                                                    value={slot.start_time}
                                                                    onChange={(e) =>
                                                                        handleSlotChange(day.id, sIdx, 'start_time', e.target.value)
                                                                    }
                                                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-mono font-medium text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="mb-1 block text-[10px] text-gray-500">Kết thúc</label>
                                                                <input
                                                                    type="time"
                                                                    value={slot.end_time}
                                                                    onChange={(e) =>
                                                                        handleSlotChange(day.id, sIdx, 'end_time', e.target.value)
                                                                    }
                                                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-mono font-medium text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={(e) => handleAddSlot(day.id, e)}
                                                    className="w-full rounded-md border border-dashed border-emerald-300 py-1.5 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-100/50"
                                                >
                                                    + Thêm ca học trong ngày
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Section 3: Ngày Nghỉ Cố Định & Nghỉ Lễ Việt Nam */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                                    <Coffee className="h-5 w-5 text-amber-600" />
                                    3. Cấu Hình Ngày Nghỉ (Cả ngày hoặc Khung giờ cụ thể)
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Bỏ qua ca học vào các ngày nghỉ lễ hoặc khung giờ nghỉ cụ thể.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    icon={<Sparkles className="h-4 w-4 text-emerald-600" />}
                                    onClick={handleOpenHolidayModal}
                                >
                                    Nạp Ngày Lễ VN
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    icon={<Plus className="h-4 w-4 text-amber-600" />}
                                    onClick={handleAddOffDay}
                                >
                                    Thêm Ngày Nghỉ
                                </Button>
                            </div>
                        </div>

                        {offDays.length > 0 ? (
                            <div className="space-y-3">
                                {offDays.map((off, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center"
                                    >
                                        <div className="w-full sm:w-44">
                                            <input
                                                type="date"
                                                value={off.date}
                                                onChange={(e) =>
                                                    handleOffDayChange(idx, 'date', e.target.value)
                                                }
                                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                                                required
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={off.is_full_day}
                                                    onChange={(e) =>
                                                        handleOffDayChange(idx, 'is_full_day', e.target.checked)
                                                    }
                                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                Nghỉ cả ngày
                                            </label>
                                        </div>

                                        {!off.is_full_day && (
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="time"
                                                    value={off.start_time || '18:00'}
                                                    onChange={(e) =>
                                                        handleOffDayChange(idx, 'start_time', e.target.value)
                                                    }
                                                    className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-mono text-gray-900"
                                                />
                                                <span className="text-xs text-gray-400">-</span>
                                                <input
                                                    type="time"
                                                    value={off.end_time || '20:00'}
                                                    onChange={(e) =>
                                                        handleOffDayChange(idx, 'end_time', e.target.value)
                                                    }
                                                    className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-mono text-gray-900"
                                                />
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={off.reason || ''}
                                                onChange={(e) =>
                                                    handleOffDayChange(idx, 'reason', e.target.value)
                                                }
                                                placeholder="Lý do nghỉ (Tùy chọn)"
                                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900"
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            icon={<Trash2 className="h-4 w-4" />}
                                            onClick={() => handleRemoveOffDay(idx)}
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-lg border border-dashed border-gray-200 py-4 text-center text-sm text-gray-400">
                                Chưa có ngày nghỉ nào được thiết lập.
                            </p>
                        )}
                    </Card>

                    {/* Section 4: Ngày Giờ Học Bù Cố Định (Extra Days) */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                                    <CalendarPlus className="h-5 w-5 text-purple-600" />
                                    4. Thêm Ngày Giờ Học Bù Cố Định (Tùy chọn)
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Ví dụ: Học bù, học tăng cường vào ngày cụ thể (10:00 - 12:00 ngày 20-01-2026).
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                icon={<Plus className="h-4 w-4 text-purple-600" />}
                                onClick={handleAddExtraDay}
                            >
                                Thêm Buổi Học Bù
                            </Button>
                        </div>

                        {extraDays.length > 0 ? (
                            <div className="space-y-3">
                                {extraDays.map((extra, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-purple-50/30 p-3.5 sm:flex-row sm:items-center"
                                    >
                                        <div className="w-full sm:w-44">
                                            <input
                                                type="date"
                                                value={extra.date}
                                                onChange={(e) =>
                                                    handleExtraDayChange(idx, 'date', e.target.value)
                                                }
                                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="time"
                                                value={extra.start_time}
                                                onChange={(e) =>
                                                    handleExtraDayChange(idx, 'start_time', e.target.value)
                                                }
                                                className="w-28 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm font-mono text-gray-900"
                                                required
                                            />
                                            <span className="text-sm text-gray-400">-</span>
                                            <input
                                                type="time"
                                                value={extra.end_time}
                                                onChange={(e) =>
                                                    handleExtraDayChange(idx, 'end_time', e.target.value)
                                                }
                                                className="w-28 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm font-mono text-gray-900"
                                                required
                                            />
                                        </div>
                                        <div className="flex-1 text-xs text-gray-500 italic">
                                            Buổi học bù / tăng cường
                                        </div>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            icon={<Trash2 className="h-4 w-4" />}
                                            onClick={() => handleRemoveExtraDay(idx)}
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-lg border border-dashed border-gray-200 py-4 text-center text-sm text-gray-400">
                                Chưa có buổi học bù nào.
                            </p>
                        )}
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href="/schedules">
                            <Button variant="secondary" size="lg">
                                Hủy Bỏ
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            variant="success"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            {totalSessions && totalSessions > 0 && !endDate
                                ? `Tạo & Sinh ${totalSessions} Ca Học`
                                : 'Tạo & Sinh Ca Học'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Holiday Picker Modal */}
            <Modal
                isOpen={showHolidayModal}
                onClose={() => setShowHolidayModal(false)}
                title="Chọn Ngày Nghỉ Lễ Việt Nam"
                maxWidth="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Tick chọn các ngày lễ mà trung tâm sẽ cho học sinh nghỉ học (hệ thống tự động bỏ qua khi sinh ca học):
                    </p>

                    {isLoadingHolidays ? (
                        <div className="py-8 text-center text-sm text-gray-400">Đang tải danh sách ngày lễ...</div>
                    ) : availableHolidays.length > 0 ? (
                        <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-2">
                            {availableHolidays.map((h) => {
                                const isChecked = selectedHolidayDates.has(h.date);
                                return (
                                    <label
                                        key={h.date}
                                        onClick={() => handleToggleHolidaySelection(h.date)}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                            isChecked
                                                ? 'border-emerald-500 bg-emerald-50/60'
                                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {}}
                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{h.name}</div>
                                                <div className="text-xs font-mono text-gray-500">{h.date}</div>
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-sm text-gray-400">Không tìm thấy ngày lễ nào.</div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => setShowHolidayModal(false)}
                        >
                            Đóng
                        </Button>
                        <Button
                            type="button"
                            variant="success"
                            size="md"
                            onClick={handleApplyHolidays}
                        >
                            Áp Dụng ({selectedHolidayDates.size} ngày)
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}


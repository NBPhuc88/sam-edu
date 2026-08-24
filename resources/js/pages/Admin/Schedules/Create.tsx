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
    CalendarDays,
    Sparkles,
    Calendar,
    Check,
    AlertCircle,
    Edit3,
    BookOpen,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';
import CustomTimePicker from '@/components/ui/CustomTimePicker';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import { parseDate, toISODateString } from '@/lib/date';

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
    center?: Center;
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
    capacity?: number | null;
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
    id?: number;
    date: string;
    name: string;
    is_lunar?: boolean;
    is_recurring?: boolean;
    reason?: string;
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

const TIME_PRESETS = [
    { label: 'Sáng ca 1 (08:00 - 10:00)', start: '08:00', end: '10:00' },
    { label: 'Sáng ca 2 (10:00 - 12:00)', start: '10:00', end: '12:00' },
    { label: 'Chiều ca 1 (14:00 - 16:00)', start: '14:00', end: '16:00' },
    { label: 'Chiều ca 2 (16:00 - 18:00)', start: '16:00', end: '18:00' },
    { label: 'Tối ca 1 (18:00 - 20:00)', start: '18:00', end: '20:00' },
    { label: 'Tối ca 2 (19:30 - 21:00)', start: '19:30', end: '21:00' },
];

const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, '0')); // 06..23
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const HOUR_OPTIONS = HOURS.map((h) => ({ value: h, label: h }));
const MINUTE_OPTIONS = MINUTES.map((m) => ({ value: m, label: m }));

export interface SlotOverlapError {
    dayId: number;
    dayLabel: string;
    message: string;
}

function ensureEndTimeAfterStart(newStart: string, currentEnd: string, defaultDuration = 120): string {
    if (!newStart) return currentEnd;
    const [sH, sM] = newStart.split(':').map((v) => parseInt(v, 10) || 0);
    const [eH, eM] = (currentEnd || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
    const startTotal = sH * 60 + sM;
    const endTotal = eH * 60 + eM;

    if (endTotal <= startTotal) {
        const targetTotal = Math.min(23 * 60 + 55, startTotal + defaultDuration);
        const targetH = Math.floor(targetTotal / 60);
        const targetM = targetTotal % 60;
        return `${String(targetH).padStart(2, '0')}:${String(targetM).padStart(2, '0')}`;
    }
    return currentEnd;
}

export const validateWeeklyTimes = (
    weeklyTimes: Record<number, { enabled: boolean; slots: WeekDaySlot[] }>
): SlotOverlapError[] => {
    const errors: SlotOverlapError[] = [];
    const DAY_LABELS: Record<number, string> = {
        1: 'Thứ 2',
        2: 'Thứ 3',
        3: 'Thứ 4',
        4: 'Thứ 5',
        5: 'Thứ 6',
        6: 'Thứ 7',
        7: 'Chủ Nhật',
    };

    Object.entries(weeklyTimes).forEach(([dayStr, conf]) => {
        if (!conf.enabled || !conf.slots || conf.slots.length === 0) return;
        const dayId = Number(dayStr);
        const dayLabel = DAY_LABELS[dayId] || `Thứ ${dayId}`;
        const slots = conf.slots;

        for (let i = 0; i < slots.length; i++) {
            const s1 = slots[i];
            const start1 = s1.start_time ? String(s1.start_time).slice(0, 5) : '';
            const end1 = s1.end_time ? String(s1.end_time).slice(0, 5) : '';

            if (start1 && end1 && start1 >= end1) {
                errors.push({
                    dayId,
                    dayLabel,
                    message: `Ca ${i + 1} (${start1} - ${end1}): Giờ kết thúc phải sau giờ bắt đầu.`,
                });
            }

            for (let j = i + 1; j < slots.length; j++) {
                const s2 = slots[j];
                const start2 = s2.start_time ? String(s2.start_time).slice(0, 5) : '';
                const end2 = s2.end_time ? String(s2.end_time).slice(0, 5) : '';

                if (start1 && end1 && start2 && end2) {
                    if (start1 < end2 && start2 < end1) {
                        errors.push({
                            dayId,
                            dayLabel,
                            message: `Các ca học bị trùng giờ: Ca ${i + 1} (${start1} - ${end1}) trùng với Ca ${j + 1} (${start2} - ${end2}).`,
                        });
                    }
                }
            }
        }
    });

    return errors;
};

function calculateEstimatedEndDate(
    startDateStr: string,
    weeklyTimes: Record<number, { enabled: boolean; slots: WeekDaySlot[] }>,
    totalSessions: number,
    offDays: OffDayItem[],
    extraDays: ExtraDayItem[] = [],
    holidayDates: string[] = []
): string | null {
    if (!startDateStr || !totalSessions || totalSessions <= 0) {
        return null;
    }

    const parsedStart = parseDate(startDateStr);
    if (!parsedStart) {
        return null;
    }

    const startIso = toISODateString(startDateStr);

    const enabledDays = Object.entries(weeklyTimes)
        .filter(([, conf]) => conf.enabled && conf.slots.length > 0)
        .map(([day]) => Number(day));

    if (enabledDays.length === 0 && extraDays.length === 0) {
        return null;
    }

    const fullOffDatesSet = new Set(
        offDays.filter((s) => s.is_full_day && s.date).map((s) => toISODateString(s.date))
    );
    const holidayDatesSet = new Set(holidayDates.map((h) => toISODateString(h)));

    const extraDaysByDate: Record<string, ExtraDayItem[]> = {};
    for (const extra of extraDays) {
        const extraIso = toISODateString(extra.date);
        if (extraIso && extra.start_time && extra.end_time && extraIso >= startIso) {
            if (!extraDaysByDate[extraIso]) {
                extraDaysByDate[extraIso] = [];
            }
            extraDaysByDate[extraIso].push(extra);
        }
    }

    let createdCount = 0;
    const curr = new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate());
    let lastDate: string | null = null;
    let loopGuard = 0;

    while (createdCount < totalSessions && loopGuard < 1500) {
        loopGuard++;
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        const ymd = `${y}-${m}-${d}`;

        const jsDay = curr.getDay();
        const isoDay = jsDay === 0 ? 7 : jsDay;

        // 1. Thêm các buổi học bù/bổ sung trên ngày này
        if (extraDaysByDate[ymd]) {
            for (const _extra of extraDaysByDate[ymd]) {
                createdCount++;
                lastDate = ymd;
                if (createdCount >= totalSessions) {
                    break;
                }
            }
        }

        if (createdCount >= totalSessions) {
            break;
        }

        // 2. Thêm các ca học định kỳ trong tuần (nếu không phải ngày nghỉ/ngày lễ)
        if (enabledDays.includes(isoDay) && !fullOffDatesSet.has(ymd) && !holidayDatesSet.has(ymd)) {
            const slots = weeklyTimes[isoDay]?.slots || [];
            for (const slot of slots) {
                const isSlotOff = offDays.some(
                    (o) => !o.is_full_day && toISODateString(o.date) === ymd && o.start_time === slot.start_time
                );
                const isAlreadyCoveredByExtra = extraDaysByDate[ymd]?.some(
                    (e) => e.start_time === slot.start_time
                );
                if (!isSlotOff && !isAlreadyCoveredByExtra) {
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

    // Holiday picker modal state & Auto holidays toggle
    const [autoHolidays, setAutoHolidays] = useState<boolean>(true);
    const [excludedHolidayIds, setExcludedHolidayIds] = useState<Set<number>>(new Set());
    const [scheduleHolidays, setScheduleHolidays] = useState<VNHoliday[]>([]);
    const [showHolidayModal, setShowHolidayModal] = useState<boolean>(false);
    const [availableHolidays, setAvailableHolidays] = useState<VNHoliday[]>([]);
    const [selectedHolidayDates, setSelectedHolidayDates] = useState<Set<string>>(new Set());
    const [isLoadingHolidays, setIsLoadingHolidays] = useState<boolean>(false);

    // Time slot picker modal state (explicit Save button)
    const [slotModalOpen, setSlotModalOpen] = useState<boolean>(false);
    const [editingDayId, setEditingDayId] = useState<number | null>(null);
    const [editingSlotIdx, setEditingSlotIdx] = useState<number | null>(null);
    const [modalStartTime, setModalStartTime] = useState<string>('18:00');
    const [modalEndTime, setModalEndTime] = useState<string>('20:00');
    const [modalSlotError, setModalSlotError] = useState<string | null>(null);
    const [formSubmitError, setFormSubmitError] = useState<string | null>(null);

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

    const activeHolidayDates = React.useMemo(() => {
        if (!autoHolidays) return [];
        return scheduleHolidays
            .filter((h) => (h.id ? !excludedHolidayIds.has(h.id) : true))
            .map((h) => h.date);
    }, [autoHolidays, scheduleHolidays, excludedHolidayIds]);

    const estimatedEndDate = React.useMemo(() => {
        if (!totalSessions || !startDate) {
            return null;
        }
        return calculateEstimatedEndDate(
            startDate,
            weeklyTimes,
            totalSessions,
            offDays,
            extraDays,
            activeHolidayDates
        );
    }, [startDate, weeklyTimes, totalSessions, offDays, extraDays, activeHolidayDates]);

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
        if (field === 'start_time') {
            const currentEnd = updated[index].end_time || '20:00';
            updated[index].end_time = ensureEndTimeAfterStart(val, currentEnd);
        }
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
        if (field === 'start_time') {
            const currentEnd = updated[index].end_time || '10:00';
            updated[index].end_time = ensureEndTimeAfterStart(val, currentEnd);
        }
        setExtraDays(updated);
    };

    // Fetch VN Holidays from API
    const handleOpenHolidayModal = async () => {
        setShowHolidayModal(true);
        setIsLoadingHolidays(true);
        try {
            const res = await fetch(`/api/vietnam-holidays`);
            if (res.ok) {
                const data = await res.json();
                const holidaysList: VNHoliday[] = data.holidays || [];
                setAvailableHolidays(holidaysList);
                const activeDates = new Set(
                    holidaysList
                        .filter((h) => (h.id ? !excludedHolidayIds.has(h.id) : true))
                        .map((h) => h.date)
                );
                setSelectedHolidayDates(activeDates);
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
        const newExcluded = new Set<number>();
        availableHolidays.forEach((h) => {
            if (!selectedHolidayDates.has(h.date) && h.id !== undefined) {
                newExcluded.add(h.id);
            }
        });
        setExcludedHolidayIds(newExcluded);
        const selected = availableHolidays.filter((h) => selectedHolidayDates.has(h.date));
        setScheduleHolidays(selected);
        setAutoHolidays(true);
        setShowHolidayModal(false);
    };

    const slotOverlapErrors = React.useMemo(() => {
        return validateWeeklyTimes(weeklyTimes);
    }, [weeklyTimes]);

    const openSlotModal = (dayId: number, slotIdx: number | null = null, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingDayId(dayId);
        setEditingSlotIdx(slotIdx);
        setModalSlotError(null);

        const dayConf = weeklyTimes[dayId];
        if (slotIdx !== null && dayConf?.slots[slotIdx]) {
            setModalStartTime(dayConf.slots[slotIdx].start_time);
            setModalEndTime(dayConf.slots[slotIdx].end_time);
        } else {
            const existing = dayConf?.slots || [];
            if (existing.length > 0) {
                const lastEnd = existing[existing.length - 1].end_time;
                if (lastEnd === '10:00') {
                    setModalStartTime('10:00');
                    setModalEndTime('12:00');
                } else if (lastEnd === '16:00') {
                    setModalStartTime('16:00');
                    setModalEndTime('18:00');
                } else if (lastEnd === '20:00') {
                    setModalStartTime('20:00');
                    setModalEndTime('21:30');
                } else {
                    setModalStartTime('18:00');
                    setModalEndTime('20:00');
                }
            } else {
                setModalStartTime('18:00');
                setModalEndTime('20:00');
            }
        }
        setSlotModalOpen(true);
    };

    const handleSaveModalSlot = () => {
        if (!editingDayId) return;

        const start = modalStartTime ? String(modalStartTime).slice(0, 5) : '';
        const end = modalEndTime ? String(modalEndTime).slice(0, 5) : '';

        if (!start || !end) {
            setModalSlotError('Vui lòng chọn hoặc nhập đầy đủ giờ bắt đầu và kết thúc.');
            return;
        }

        if (start >= end) {
            setModalSlotError('Giờ kết thúc phải sau giờ bắt đầu!');
            return;
        }

        const dayConf = weeklyTimes[editingDayId];
        const existingSlots = dayConf?.slots || [];

        for (let idx = 0; idx < existingSlots.length; idx++) {
            if (editingSlotIdx !== null && idx === editingSlotIdx) continue;
            const s = existingSlots[idx];
            const sStart = s.start_time ? String(s.start_time).slice(0, 5) : '';
            const sEnd = s.end_time ? String(s.end_time).slice(0, 5) : '';

            if (sStart && sEnd && start < sEnd && sStart < end) {
                const dayLabel = WEEKDAYS.find((d) => d.id === editingDayId)?.label || `Thứ ${editingDayId}`;
                setModalSlotError(`Khung giờ ${start} - ${end} bị trùng/chồng chéo với Ca ${idx + 1} (${sStart} - ${sEnd}) của ${dayLabel}!`);
                return;
            }
        }

        setWeeklyTimes((prev) => {
            const currentConf = prev[editingDayId];
            const updatedSlots = [...currentConf.slots];

            if (editingSlotIdx !== null) {
                updatedSlots[editingSlotIdx] = { start_time: start, end_time: end };
            } else {
                updatedSlots.push({ start_time: start, end_time: end });
            }

            return {
                ...prev,
                [editingDayId]: {
                    ...currentConf,
                    enabled: true,
                    slots: updatedSlots,
                },
            };
        });

        setModalSlotError(null);
        setFormSubmitError(null);
        setSlotModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitError(null);

        const slotErrors = validateWeeklyTimes(weeklyTimes);
        if (slotErrors.length > 0) {
            setFormSubmitError(`Không thể lưu lịch học: ${slotErrors[0].message}`);
            return;
        }

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
                weeks: weeksPayload,
                auto_holidays: autoHolidays,
                excluded_holiday_ids: Array.from(excludedHolidayIds),
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
        <AppLayout title="Thiết Lập Lịch Học Mới - SAM Digital">
            <Head title="Thiết Lập Lịch Học Mới" />

            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/schedules">
                            <Button variant="secondary" size="md" icon={<ArrowLeft className="h-5 w-5" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Thiết Lập Lịch Học Mới
                            </h1>
                            <p className="text-sm text-gray-500">
                                Tạo chu kỳ học tập theo tuần, hệ thống sẽ tự động tính toán ngày kết thúc và sinh toàn bộ ca học tương ứng.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Thông tin Lớp học & Môn học */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-4 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <BookOpen className="h-5 w-5 text-emerald-600" />
                            1. Thông Tin Lớp Học & Môn Học
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                    <option value="">-- Chọn lớp học --</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code}) - {c.center?.name || 'Trung tâm'}
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
                                    disabled={!selectedClassId}
                                >
                                    <option value="">-- Chọn môn học --</option>
                                    {displaySubjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code}) - {s.total_sessions ? `${s.total_sessions} buổi` : 'N/A'}
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
                                    Giáo Viên Phụ Trách <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                    disabled={!selectedClassId}
                                >
                                    <option value="">-- Chọn giáo viên --</option>
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
                                    <option value="">-- Chưa chỉ định phòng học cố định --</option>
                                    {displayRooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} (Sức chứa: {r.capacity} học sinh)
                                        </option>
                                    ))}
                                </select>
                                {errors.room_id && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.room_id}</p>
                                )}
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Bắt Đầu Học <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    value={startDate}
                                    onChange={(val) => setStartDate(val)}
                                    className="w-full !py-3"
                                    required
                                />
                                {errors.start_date && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.start_date}</p>
                                )}
                            </div>

                            {/* End Date (Read-only, auto calculated from last session) */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-800">
                                        Ngày Kết Thúc (Dự kiến)
                                    </label>
                                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                        ✨ Tự động theo ca cuối
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={estimatedEndDate ? `Dự kiến: ${estimatedEndDate}` : 'Chưa xác định (vui lòng chọn ngày bắt đầu & lịch)'}
                                    disabled
                                    readOnly
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xs cursor-not-allowed"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">
                                    Hệ thống tự động tính ngày kết thúc dựa trên ngày diễn ra ca học cuối cùng {totalSessions ? `(đủ ${totalSessions} buổi)` : ''}.
                                </p>
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

                        {formSubmitError && (
                            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                                <span>{formSubmitError}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {WEEKDAYS.map((day) => {
                                const conf = weeklyTimes[day.id];
                                const dayErrors = slotOverlapErrors.filter((err) => err.dayId === day.id);
                                const hasError = dayErrors.length > 0;

                                return (
                                    <div
                                        key={day.id}
                                        onClick={() => toggleWeekday(day.id)}
                                        className={`cursor-pointer rounded-xl border p-4 transition-all ${hasError
                                            ? 'border-red-400 bg-red-50/50 shadow-xs'
                                            : conf.enabled
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
                                                            <span className="flex items-center gap-1">
                                                                <span>Ca {sIdx + 1}</span>
                                                                <span className="font-mono text-gray-500">({slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)})</span>
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => openSlotModal(day.id, sIdx, e)}
                                                                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-0.5"
                                                                    title="Chỉnh sửa giờ trong popup có nút Lưu"
                                                                >
                                                                    <Edit3 className="h-3 w-3" />
                                                                    Sửa
                                                                </button>
                                                                {conf.slots.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleRemoveSlot(day.id, sIdx, e)}
                                                                        className="text-red-500 hover:text-red-700 text-xs"
                                                                        title="Xóa ca này"
                                                                    >
                                                                        Xóa
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="mb-1 block text-[10px] text-gray-500 font-medium">Bắt đầu</label>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => openSlotModal(day.id, sIdx, e)}
                                                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-xs hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors"
                                                                    title="Bấm để chỉnh sửa giờ ca học (Có nút Lưu)"
                                                                >
                                                                    <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                                    <span>{slot.start_time?.slice(0, 5) || '18:00'}</span>
                                                                </button>
                                                            </div>
                                                            <div>
                                                                <label className="mb-1 block text-[10px] text-gray-500 font-medium">Kết thúc</label>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => openSlotModal(day.id, sIdx, e)}
                                                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-xs hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors"
                                                                    title="Bấm để chỉnh sửa giờ ca học (Có nút Lưu)"
                                                                >
                                                                    <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                                    <span>{slot.end_time?.slice(0, 5) || '20:00'}</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {hasError && (
                                                    <div className="space-y-1">
                                                        {dayErrors.map((err, eIdx) => (
                                                            <div key={eIdx} className="flex items-start gap-1 rounded-md bg-red-100 p-2 text-[11px] font-semibold text-red-800">
                                                                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
                                                                <span>{err.message}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={(e) => openSlotModal(day.id, null, e)}
                                                    className="w-full rounded-md border border-dashed border-emerald-300 py-1.5 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-100/50 flex items-center justify-center gap-1"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Thêm / Chọn giờ ca học (Có nút Lưu)
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
                                    3. Cấu Hình Ngày Nghỉ Của Lớp & Nghỉ Lễ
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Bỏ qua ca học vào các ngày nghỉ lễ quốc gia hoặc ngày nghỉ riêng của lớp.
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
                                    Chọn Ngày Lễ Áp Dụng
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    icon={<Plus className="h-4 w-4 text-amber-600" />}
                                    onClick={handleAddOffDay}
                                >
                                    Thêm Ngày Nghỉ Của Lớp
                                </Button>
                            </div>
                        </div>

                        {/* Holiday toggle switch */}
                        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                            <div className="flex items-center gap-3">
                                <CalendarDays className="h-5 w-5 text-emerald-600 shrink-0" />
                                <div>
                                    <span className="text-xs font-bold uppercase text-emerald-950">
                                        Tự Động Nghỉ Theo Ngày Lễ Quốc Gia
                                    </span>
                                    <p className="text-[11px] text-emerald-800">
                                        Hệ thống tự động bỏ qua các ca học định kỳ rơi vào ngày lễ và tự dời sang ngày tiếp theo
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center shrink-0">
                                <input
                                    type="checkbox"
                                    checked={autoHolidays}
                                    onChange={(e) => setAutoHolidays(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="peer h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden"></div>
                            </label>
                        </div>

                        {/* Excluded Holidays Notice if customized */}
                        {excludedHolidayIds.size > 0 && (
                            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                                <span className="font-bold">
                                    Lưu ý: Lớp đang loại trừ không nghỉ {excludedHolidayIds.size} ngày lễ (vẫn học bình thường).
                                </span>
                            </div>
                        )}

                        {offDays.length > 0 ? (
                            <div className="space-y-3">
                                {offDays.map((off, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center"
                                    >
                                        <div className="w-full sm:w-44">
                                            <DatePicker
                                                value={off.date}
                                                onChange={(val) =>
                                                    handleOffDayChange(idx, 'date', val)
                                                }
                                                className="w-full !py-2"
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
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <CustomTimePicker
                                                    className="w-24 shrink-0"
                                                    value={off.start_time || '18:00'}
                                                    onChange={(val) =>
                                                        handleOffDayChange(idx, 'start_time', val)
                                                    }
                                                />
                                                <span className="text-xs text-gray-400">-</span>
                                                <CustomTimePicker
                                                    className="w-24 shrink-0"
                                                    value={off.end_time || '20:00'}
                                                    onChange={(val) =>
                                                        handleOffDayChange(idx, 'end_time', val)
                                                    }
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
                                            <DatePicker
                                                value={extra.date}
                                                onChange={(val) =>
                                                    handleExtraDayChange(idx, 'date', val)
                                                }
                                                className="w-full !py-2"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <CustomTimePicker
                                                className="w-24 shrink-0"
                                                value={extra.start_time || '08:00'}
                                                onChange={(val) =>
                                                    handleExtraDayChange(idx, 'start_time', val)
                                                }
                                            />
                                            <span className="text-sm text-gray-400">-</span>
                                            <CustomTimePicker
                                                className="w-24 shrink-0"
                                                value={extra.end_time || '10:00'}
                                                onChange={(val) =>
                                                    handleExtraDayChange(idx, 'end_time', val)
                                                }
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
                            {totalSessions && totalSessions > 0
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
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isChecked
                                            ? 'border-emerald-500 bg-emerald-50/60'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => { }}
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

            {/* Time Slot Setup Modal (Explicit Save Button) */}
            <Modal
                isOpen={slotModalOpen}
                onClose={() => {
                    setSlotModalOpen(false);
                    setModalSlotError(null);
                }}
                title={`Cấu Hình Khung Giờ Ca Học - ${WEEKDAYS.find((d) => d.id === editingDayId)?.label || ''}`}
                footer={
                    <div className="flex items-center justify-end gap-3 w-full">
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => {
                                setSlotModalOpen(false);
                                setModalSlotError(null);
                            }}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            type="button"
                            variant="success"
                            size="md"
                            icon={<Check className="h-5 w-5" />}
                            onClick={handleSaveModalSlot}
                        >
                            Lưu Ca Học
                        </Button>
                    </div>
                }
            >
                <div className="space-y-5">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
                            Gợi Ý Khung Giờ Nhanh:
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {TIME_PRESETS.map((p, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setModalStartTime(p.start);
                                        setModalEndTime(p.end);
                                        setModalSlotError(null);
                                    }}
                                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${modalStartTime === p.start && modalEndTime === p.end
                                        ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-800 ring-2 ring-emerald-500/20'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-slate-50'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-900">
                            Tùy Chỉnh Giờ Ca Học:
                        </h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-gray-700 uppercase">
                                    Giờ Bắt Đầu
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <ScrollableSelect
                                        label="GIỜ"
                                        value={modalStartTime.slice(0, 5).split(':')[0] || '18'}
                                        options={HOUR_OPTIONS}
                                        onChange={(val) => {
                                            const m = modalStartTime.slice(0, 5).split(':')[1] || '00';
                                            const newStart = `${val}:${m}`;
                                            const newEnd = ensureEndTimeAfterStart(newStart, modalEndTime);
                                            setModalStartTime(newStart);
                                            setModalEndTime(newEnd);
                                            setModalSlotError(null);
                                        }}
                                        placement="top"
                                        maxHeightClass="max-h-36"
                                    />
                                    <ScrollableSelect
                                        label="PHÚT"
                                        value={modalStartTime.slice(0, 5).split(':')[1] || '00'}
                                        options={MINUTE_OPTIONS}
                                        onChange={(val) => {
                                            const h = modalStartTime.slice(0, 5).split(':')[0] || '18';
                                            const newStart = `${h}:${val}`;
                                            const newEnd = ensureEndTimeAfterStart(newStart, modalEndTime);
                                            setModalStartTime(newStart);
                                            setModalEndTime(newEnd);
                                            setModalSlotError(null);
                                        }}
                                        placement="top"
                                        maxHeightClass="max-h-36"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-gray-700 uppercase">
                                    Giờ Kết Thúc
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <ScrollableSelect
                                        label="GIỜ"
                                        value={modalEndTime.slice(0, 5).split(':')[0] || '20'}
                                        options={HOUR_OPTIONS}
                                        onChange={(val) => {
                                            const m = modalEndTime.slice(0, 5).split(':')[1] || '00';
                                            setModalEndTime(`${val}:${m}`);
                                            setModalSlotError(null);
                                        }}
                                        placement="top"
                                        maxHeightClass="max-h-36"
                                    />
                                    <ScrollableSelect
                                        label="PHÚT"
                                        value={modalEndTime.slice(0, 5).split(':')[1] || '00'}
                                        options={MINUTE_OPTIONS}
                                        onChange={(val) => {
                                            const h = modalEndTime.slice(0, 5).split(':')[0] || '20';
                                            setModalEndTime(`${h}:${val}`);
                                            setModalSlotError(null);
                                        }}
                                        placement="top"
                                        maxHeightClass="max-h-36"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {modalSlotError && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
                            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                            <span>{modalSlotError}</span>
                        </div>
                    )}
                </div>
            </Modal>
        </AppLayout>
    );
}


import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CustomTimePicker from '@/components/ui/CustomTimePicker';
import DatePicker from '@/components/ui/DatePicker';
import Modal from '@/components/ui/Modal';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import AppLayout from '@/layouts/AppLayout';
import { formatDate,parseDate,toISODateString } from '@/lib/date';
import { Head,Link,router } from '@inertiajs/react';
import {
AlertCircle,
ArrowLeft,
BookOpen,
CalendarDays,
CalendarPlus,
Check,
CheckSquare,
Clock,
Coffee,
Edit3,
GraduationCap,
Plus,
Save,
Sparkles,
Square,
Trash2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface ClassSubjectSchedule {
    id: number;
    weeks?: Record<string, [string, string][]>;
    room_id?: number | null;
    room?: { id: number; name: string };
    status?: number;
    off_days?: any[];
    extra_days?: any[];
}

interface ClassSubjectItem {
    id: number;
    subject_id?: number;
    subject?: { id: number; name: string; code: string; total_sessions?: number | null; duration_minutes?: number | null };
    teacher?: { id: number; full_name: string; teacher_code: string };
    start_date?: string;
    end_date?: string;
    status?: number;
    class_schedules?: ClassSubjectSchedule[];
    classSchedules?: ClassSubjectSchedule[];
}

interface SchoolClass {
    id: number;
    name: string;
    code: string;
    center_id: number;
    start_date?: string | null;
    end_date?: string | null;
    class_subjects?: ClassSubjectItem[];
    classSubjects?: ClassSubjectItem[];
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
    class_subjects?: (ClassSubjectItem & { school_class?: { id: number; name: string; code: string }; schoolClass?: { id: number; name: string; code: string } })[];
    classSubjects?: (ClassSubjectItem & { school_class?: { id: number; name: string; code: string }; schoolClass?: { id: number; name: string; code: string } })[];
}

interface Room {
    id: number;
    name: string;
    center_id: number;
}

interface ScheduleDetail {
    id: number;
    class_subject_id: number;
    weeks: Record<string, [string, string][]>;
    off_days?: { date: string; start_time?: string | null; end_time?: string | null; reason?: string }[] | null;
    extra_days?: { date: string; start_time: string; end_time: string }[] | null;
    auto_holidays?: boolean;
    excluded_holiday_ids?: number[] | null;
    holidays?: VNHoliday[] | null;
    room_id: number | null;
    status: number;
    class_subject?: {
        id: number;
        class_id: number;
        subject_id: number;
        teacher_id?: number | null;
        start_date?: string | null;
        end_date?: string | null;
        school_class?: SchoolClass & {
            start_date?: string | null;
            end_date?: string | null;
            center?: Center;
        };
        subject?: {
            id: number;
            name: string;
            code: string;
            total_sessions?: number | null;
            duration_minutes?: number | null;
        };
        teacher?: {
            id: number;
            full_name: string;
            teacher_code: string;
        };
    };
}

interface EditProps {
    schedule: ScheduleDetail;
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

    if (enabledDays.length === 0) {
        if (extraDays.length === 0) {
            return null;
        }
        const sortedExtra = [...extraDays]
            .filter((e) => e.date && toISODateString(e.date) >= startIso)
            .sort((a, b) => toISODateString(a.date).localeCompare(toISODateString(b.date)));
        return sortedExtra.length > 0 ? toISODateString(sortedExtra[sortedExtra.length - 1].date) : null;
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

export default function ScheduleEdit({
    schedule,
    classes = [],
    teachers = [],
    rooms = [],
    errors = {},
}: EditProps) {
    const classSubject = schedule.class_subject;
    const centerId = classSubject?.school_class?.center_id;

    const currentClass = React.useMemo(() => {
        const found = classes.find((c) => c.id === classSubject?.class_id);
        return found || classSubject?.school_class;
    }, [classes, classSubject]);

    const classStartDate = currentClass?.start_date ? toISODateString(currentClass.start_date) : '';

    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
        String(classSubject?.teacher_id || ''),
    );
    const [selectedRoomId, setSelectedRoomId] = useState<string>(
        schedule.room_id ? String(schedule.room_id) : '',
    );
    const [startDate, setStartDate] = useState<string>(
        toISODateString(classSubject?.start_date || classSubject?.school_class?.start_date)
    );
    const [status] = useState<number>(schedule.status ?? 1);

    const initialWeeklyTimes = React.useMemo(() => {
        const base: Record<number, { enabled: boolean; slots: WeekDaySlot[] }> = {
            1: { enabled: false, slots: [{ start_time: '18:00', end_time: '20:00' }] },
            2: { enabled: false, slots: [{ start_time: '18:00', end_time: '20:00' }] },
            3: { enabled: false, slots: [{ start_time: '18:00', end_time: '20:00' }] },
            4: { enabled: false, slots: [{ start_time: '18:00', end_time: '20:00' }] },
            5: { enabled: false, slots: [{ start_time: '18:00', end_time: '20:00' }] },
            6: { enabled: false, slots: [{ start_time: '08:00', end_time: '10:00' }] },
            7: { enabled: false, slots: [{ start_time: '08:00', end_time: '10:00' }] },
        };

        if (schedule.weeks && typeof schedule.weeks === 'object') {
            Object.entries(schedule.weeks).forEach(([dayKey, slots]) => {
                const dayNum = Number(dayKey);
                if (base[dayNum] && Array.isArray(slots) && slots.length > 0) {
                    base[dayNum] = {
                        enabled: true,
                        slots: slots.map((s: any) => {
                            const start = Array.isArray(s) ? s[0] : (s?.start_time || s?.start);
                            const end = Array.isArray(s) ? s[1] : (s?.end_time || s?.end);
                            return {
                                start_time: start ? String(start).slice(0, 5) : '18:00',
                                end_time: end ? String(end).slice(0, 5) : '20:00',
                            };
                        }),
                    };
                }
            });
        }

        return base;
    }, [schedule]);

    const [weeklyTimes, setWeeklyTimes] = useState(initialWeeklyTimes);

    const initialOffDays = React.useMemo(() => {
        if (!schedule.off_days || !Array.isArray(schedule.off_days)) {
            return [];
        }
        return schedule.off_days.map((o: any) => ({
            date: typeof o === 'string' ? o : o.date,
            is_full_day: typeof o === 'string' || !o.start_time,
            start_time: o.start_time ? String(o.start_time).slice(0, 5) : '18:00',
            end_time: o.end_time ? String(o.end_time).slice(0, 5) : '20:00',
            reason: o.reason || 'Nghỉ theo lịch',
        }));
    }, [schedule]);

    const [offDays, setOffDays] = useState<OffDayItem[]>(initialOffDays);

    const initialExtraDays = React.useMemo(() => {
        if (!schedule.extra_days || !Array.isArray(schedule.extra_days)) {
            return [];
        }
        return schedule.extra_days.map((e: any) => ({
            date: e.date,
            start_time: e.start_time ? String(e.start_time).slice(0, 5) : '08:00',
            end_time: e.end_time ? String(e.end_time).slice(0, 5) : '10:00',
        }));
    }, [schedule]);

    const [extraDays, setExtraDays] = useState<ExtraDayItem[]>(initialExtraDays);

    // Holiday picker modal state & Auto holidays toggle
    const initialExcludedIds = React.useMemo(
        () => new Set<number>((schedule.excluded_holiday_ids || []).map(Number)),
        [schedule]
    );

    const [excludedHolidayIds, setExcludedHolidayIds] = useState<Set<number>>(initialExcludedIds);
    const [autoHolidays, setAutoHolidays] = useState<boolean>(
        schedule.auto_holidays !== undefined ? Boolean(schedule.auto_holidays) : true
    );
    const [scheduleHolidays, setScheduleHolidays] = useState<VNHoliday[]>(
        Array.isArray(schedule.holidays) ? (schedule.holidays as VNHoliday[]) : []
    );
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

    const displayTeachers = React.useMemo(() => {
        const list: Teacher[] = [];
        const seenIds = new Set<number>();

        if (classSubject?.teacher && !seenIds.has(classSubject.teacher.id)) {
            seenIds.add(classSubject.teacher.id);
            list.push({
                id: classSubject.teacher.id,
                full_name: classSubject.teacher.full_name,
                teacher_code: classSubject.teacher.teacher_code,
                center_id: centerId || 0,
            });
        }

        const centerTeachers = teachers.filter((t) => !centerId || Number(t.center_id) === Number(centerId));
        for (const t of centerTeachers) {
            if (!seenIds.has(t.id)) {
                seenIds.add(t.id);
                list.push(t);
            }
        }

        return list.length > 0 ? list : teachers;
    }, [classSubject, centerId, teachers]);

    const displayRooms = React.useMemo(() => {
        const centerRooms = rooms.filter((r) => !centerId || Number(r.center_id) === Number(centerId));
        return centerRooms.length > 0 ? centerRooms : rooms;
    }, [centerId, rooms]);

    const totalSessions = classSubject?.subject?.total_sessions;
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

    // Các môn học khác của lớp này đã có cấu hình lịch
    const existingOtherSubjectSchedules = React.useMemo(() => {
        if (!currentClass) return [];
        const rawClassSubjects = ((currentClass as any)?.class_subjects || (currentClass as any)?.classSubjects || []) as any[];

        const results: {
            subjectId: number;
            subjectName: string;
            teacherName: string;
            startDate?: string;
            endDate?: string;
            weeks: Record<string, [string, string][]>;
            roomName?: string;
        }[] = [];

        for (const cs of rawClassSubjects) {
            const csSubId = cs.subject?.id || cs.subject_id;
            // Bỏ qua chính class_subject hiện tại đang chỉnh sửa
            if (cs.id === classSubject?.id || String(csSubId) === String(classSubject?.subject_id)) continue;

            const schedules = cs.class_schedules || cs.classSchedules || [];
            const sched = Array.isArray(schedules) ? schedules[0] : schedules;
            if (sched && sched.weeks && typeof sched.weeks === 'object' && Object.keys(sched.weeks).length > 0) {
                results.push({
                    subjectId: csSubId,
                    subjectName: cs.subject?.name || `Môn #${csSubId}`,
                    teacherName: cs.teacher?.full_name || '',
                    startDate: cs.start_date,
                    endDate: cs.end_date,
                    weeks: sched.weeks,
                    roomName: sched.room?.name,
                });
            }
        }

        return results;
    }, [currentClass, classSubject]);

    const getSlotConflict = (dayId: number, startTime: string, endTime: string) => {
        if (!startTime || !endTime) return null;
        const cleanStart = startTime.slice(0, 5);
        const cleanEnd = endTime.slice(0, 5);

        for (const other of existingOtherSubjectSchedules) {
            const slots = other.weeks[String(dayId)];
            if (Array.isArray(slots)) {
                for (const oSlot of slots) {
                    const oStart = Array.isArray(oSlot) ? oSlot[0]?.slice(0, 5) : (oSlot as any)?.start_time?.slice(0, 5);
                    const oEnd = Array.isArray(oSlot) ? oSlot[1]?.slice(0, 5) : (oSlot as any)?.end_time?.slice(0, 5);
                    if (oStart && oEnd && cleanStart < oEnd && oStart < cleanEnd) {
                        return {
                            subjectName: other.subjectName,
                            timeRange: `${oStart} - ${oEnd}`,
                            dateRange: other.startDate && other.endDate ? `(${other.startDate} - ${other.endDate})` : '',
                        };
                    }
                }
            }
        }
        return null;
    };

    const currentTeacher = displayTeachers.find((t) => String(t.id) === String(selectedTeacherId));

    // Lịch dạy của giáo viên này ở các lớp khác
    const existingTeacherSchedules = React.useMemo(() => {
        if (!currentTeacher) return [];
        const rawTeacherCs = (currentTeacher.class_subjects || (currentTeacher as any).classSubjects || []) as any[];

        const results: {
            classId: number;
            className: string;
            subjectName: string;
            startDate?: string;
            endDate?: string;
            weeks: Record<string, [string, string][]>;
        }[] = [];

        for (const cs of rawTeacherCs) {
            // Bỏ qua nếu chính là class_subject hiện tại đang chỉnh sửa
            if (cs.id === classSubject?.id) {
                continue;
            }

            const csClassId = cs.school_class?.id || cs.schoolClass?.id || cs.class_id;
            const csSubId = cs.subject?.id || cs.subject_id;

            const schedules = cs.class_schedules || cs.classSchedules || [];
            const sched = Array.isArray(schedules) ? schedules[0] : schedules;
            if (sched && sched.weeks && typeof sched.weeks === 'object' && Object.keys(sched.weeks).length > 0) {
                results.push({
                    classId: csClassId,
                    className: cs.school_class?.name || cs.schoolClass?.name || `Lớp #${csClassId}`,
                    subjectName: cs.subject?.name || `Môn #${csSubId}`,
                    startDate: cs.start_date,
                    endDate: cs.end_date,
                    weeks: sched.weeks,
                });
            }
        }

        return results;
    }, [currentTeacher, classSubject]);

    const getTeacherSlotConflict = (dayId: number, startTime: string, endTime: string) => {
        if (!startTime || !endTime || !currentTeacher) return null;
        const cleanStart = startTime.slice(0, 5);
        const cleanEnd = endTime.slice(0, 5);

        for (const other of existingTeacherSchedules) {
            const slots = other.weeks[String(dayId)];
            if (Array.isArray(slots)) {
                for (const oSlot of slots) {
                    const oStart = Array.isArray(oSlot) ? oSlot[0]?.slice(0, 5) : (oSlot as any)?.start_time?.slice(0, 5);
                    const oEnd = Array.isArray(oSlot) ? oSlot[1]?.slice(0, 5) : (oSlot as any)?.end_time?.slice(0, 5);
                    if (oStart && oEnd && cleanStart < oEnd && oStart < cleanEnd) {
                        return {
                            teacherName: currentTeacher.full_name,
                            className: other.className,
                            subjectName: other.subjectName,
                            timeRange: `${oStart} - ${oEnd}`,
                            dateRange: other.startDate && other.endDate ? `(${other.startDate} - ${other.endDate})` : '',
                        };
                    }
                }
            }
        }
        return null;
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

    const handleAddOffDay = () => {
        const defaultOffDate = startDate && (!classStartDate || startDate >= classStartDate)
            ? startDate
            : (classStartDate || new Date().toISOString().split('T')[0]);
        setOffDays([
            ...offDays,
            {
                date: defaultOffDate,
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

    const handleAddExtraDay = () => {
        const defaultExtraDate = startDate && (!classStartDate || startDate >= classStartDate)
            ? startDate
            : (classStartDate || new Date().toISOString().split('T')[0]);
        setExtraDays([
            ...extraDays,
            {
                date: defaultExtraDate,
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

        // Kiểm tra trùng với môn học khác của cùng lớp
        const otherConflict = getSlotConflict(editingDayId, start, end);
        if (otherConflict) {
            const dayLabel = WEEKDAYS.find((d) => d.id === editingDayId)?.label || `Thứ ${editingDayId}`;
            setModalSlotError(`Khung giờ ${start} - ${end} (${dayLabel}) bị trùng với môn ${otherConflict.subjectName} (${otherConflict.timeRange}) của lớp này!`);
            return;
        }

        // Kiểm tra trùng với lịch dạy ở lớp khác của giáo viên
        const teacherConflict = getTeacherSlotConflict(editingDayId, start, end);
        if (teacherConflict) {
            const dayLabel = WEEKDAYS.find((d) => d.id === editingDayId)?.label || `Thứ ${editingDayId}`;
            setModalSlotError(`Khung giờ ${start} - ${end} (${dayLabel}) bị trùng với lịch dạy lớp ${teacherConflict.className} (môn ${teacherConflict.subjectName}) của Giáo viên ${teacherConflict.teacherName}!`);
            return;
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

    const scrollToFirstError = () => {
        setTimeout(() => {
            const errorSelectors = [
                '.border-red-400',
                '.border-red-500',
                '.text-red-600',
                '.text-red-800',
                '.text-amber-900',
                '#form-submit-error',
                '#section-weekly-schedule-error',
                'input:invalid',
                'select:invalid',
            ];

            for (const selector of errorSelectors) {
                const elements = document.querySelectorAll(selector);
                for (let i = 0; i < elements.length; i++) {
                    const el = elements[i] as HTMLElement;
                    if (el && el.offsetParent !== null) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        if (typeof el.focus === 'function' && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'BUTTON')) {
                            el.focus({ preventScroll: true });
                        }
                        return;
                    }
                }
            }
        }, 100);
    };

    useEffect(() => {
        if (Object.keys(errors).length > 0 || formSubmitError) {
            scrollToFirstError();
        }
    }, [errors, formSubmitError]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitError(null);

        const slotErrors = validateWeeklyTimes(weeklyTimes);
        if (slotErrors.length > 0) {
            setFormSubmitError(`Không thể lưu lịch học: ${slotErrors[0].message}`);
            scrollToFirstError();
            return;
        }

        // Kiểm tra trùng lịch với môn học khác và lịch dạy của giáo viên
        for (const day of WEEKDAYS) {
            const conf = weeklyTimes[day.id];
            if (conf?.enabled) {
                for (let i = 0; i < conf.slots.length; i++) {
                    const slot = conf.slots[i];
                    const otherConflict = getSlotConflict(day.id, slot.start_time, slot.end_time);
                    if (otherConflict) {
                        setFormSubmitError(`Trùng lịch học trong lớp: Khung giờ ${day.label} (${slot.start_time?.slice(0, 5)} - ${slot.end_time?.slice(0, 5)}) bị trùng với môn ${otherConflict.subjectName} (${otherConflict.timeRange})!`);
                        scrollToFirstError();
                        return;
                    }

                    const teacherConflict = getTeacherSlotConflict(day.id, slot.start_time, slot.end_time);
                    if (teacherConflict) {
                        setFormSubmitError(`Trùng lịch dạy của giáo viên: Khung giờ ${day.label} (${slot.start_time?.slice(0, 5)} - ${slot.end_time?.slice(0, 5)}) bị trùng với lịch dạy lớp ${teacherConflict.className} (môn ${teacherConflict.subjectName}) của Giáo viên ${teacherConflict.teacherName}!`);
                        scrollToFirstError();
                        return;
                    }
                }
            }
        }

        if (classStartDate && startDate < classStartDate) {
            setFormSubmitError(`Ngày bắt đầu lịch học không được nhỏ hơn ngày bắt đầu của lớp (${formatDate(classStartDate)})!`);
            scrollToFirstError();
            return;
        }

        if (classStartDate) {
            for (const off of offDays) {
                if (off.date && toISODateString(off.date) < classStartDate) {
                    setFormSubmitError(`Ngày nghỉ (${formatDate(off.date)}) không được nhỏ hơn ngày bắt đầu của lớp (${formatDate(classStartDate)})!`);
                    scrollToFirstError();
                    return;
                }
            }
            for (const extra of extraDays) {
                if (extra.date && toISODateString(extra.date) < classStartDate) {
                    setFormSubmitError(`Ngày học bù (${formatDate(extra.date)}) không được nhỏ hơn ngày bắt đầu của lớp (${formatDate(classStartDate)})!`);
                    scrollToFirstError();
                    return;
                }
            }
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

        router.patch(
            `/schedules/${schedule.id}`,
            {
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
                onError: () => scrollToFirstError(),
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Cập Nhật Lịch Học - SAM Digital">
            <Head title="Cập Nhật Lịch Học" />

            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/schedules">
                            <Button variant="secondary" size="md" icon={<ArrowLeft className="h-5 w-5" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Cập Nhật Lịch Học</h1>
                            <p className="text-sm text-gray-500">
                                Lớp: <span className="font-semibold text-gray-800">{classSubject?.school_class?.name}</span> | Môn: <span className="font-semibold text-emerald-700">{classSubject?.subject?.name}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-5 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <GraduationCap className="h-5 w-5 text-emerald-600" />
                            1. Thông Tin Chung
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Lớp Học
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={`${classSubject?.school_class?.name || ''} (${classSubject?.school_class?.code || ''})`}
                                    className="w-full rounded-lg border border-gray-200 bg-slate-100 px-4 py-3 text-sm font-medium text-gray-600 shadow-xs cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Môn Học
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={`${classSubject?.subject?.name || ''}${totalSessions ? ` (${totalSessions} buổi)` : ''}`}
                                    className="w-full rounded-lg border border-gray-200 bg-slate-100 px-4 py-3 text-sm font-medium text-gray-600 shadow-xs cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Giáo Viên <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500"
                                    required
                                >
                                    <option value="">-- Chọn Giáo Viên --</option>
                                    {displayTeachers.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.full_name}
                                        </option>
                                    ))}
                                </select>
                                {errors.teacher_id && !errors.teacher_id.includes('Trùng lịch') && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.teacher_id}</p>
                                )}
                                {errors.teacher_id && errors.teacher_id.includes('Trùng lịch') && (
                                    <p className="mt-1.5 flex items-center gap-1 text-sm font-medium text-amber-700">
                                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                        <span>Trùng lịch dạy trong tuần (xem chi tiết và điều chỉnh tại Mục 2 bên dưới).</span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Phòng Học (Tùy chọn)
                                </label>
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500"
                                >
                                    <option value="">-- Chưa Chọn Phòng (Online / Linh hoạt) --</option>
                                    {displayRooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Bắt Đầu Môn Học <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    value={startDate}
                                    onChange={(val) => setStartDate(val)}
                                    min={classStartDate || undefined}
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
                                    value={
                                        estimatedEndDate
                                            ? `Dự kiến: ${estimatedEndDate}`
                                            : classSubject?.end_date
                                                ? `Hiện tại: ${String(classSubject.end_date).slice(0, 10)}`
                                                : 'Chưa xác định (vui lòng chọn ngày bắt đầu & lịch)'
                                    }
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

                    {/* Thời khóa biểu các môn đã xếp lịch của lớp */}
                    {currentClass && (
                        <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                                    <BookOpen className="h-5 w-5 text-indigo-600" />
                                    Lịch Học Các Môn Khác Của Lớp ({currentClass.name})
                                </h2>
                                <span className="text-xs font-semibold text-gray-500">
                                    {existingOtherSubjectSchedules.length} môn khác đã xếp lịch
                                </span>
                            </div>

                            {existingOtherSubjectSchedules.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-300 bg-slate-50 p-4 text-center text-sm text-gray-500">
                                    Lớp này hiện chưa có môn học nào khác được xếp lịch song song. Bạn có thể tự do chỉnh sửa lịch vào bất kỳ khung giờ nào.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-600">
                                        Dưới đây là các khung giờ đã được xếp cho các môn học khác trong cùng lớp. Hệ thống sẽ tự động ngăn chặn việc sửa lịch bị trùng vào các khung giờ này:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {existingOtherSubjectSchedules.map((other) => (
                                            <div key={other.subjectId} className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3.5 shadow-xs">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-sm font-bold text-indigo-950">{other.subjectName}</span>
                                                    {other.roomName && (
                                                        <span className="text-[10px] font-semibold bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                                                            {other.roomName}
                                                        </span>
                                                    )}
                                                </div>
                                                {other.teacherName && (
                                                    <p className="text-xs text-gray-600 mb-2">GV: {other.teacherName}</p>
                                                )}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(other.weeks).map(([dKey, sList]) => {
                                                        const dLabel = WEEKDAYS.find((w) => String(w.id) === String(dKey))?.label || `T${dKey}`;
                                                        return sList.map(([st, en], idx) => (
                                                            <span key={`${dKey}-${idx}`} className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-mono font-bold text-indigo-900 border border-indigo-200">
                                                                <span className="text-indigo-600 font-sans">{dLabel}:</span>
                                                                <span>{st.slice(0, 5)} - {en.slice(0, 5)}</span>
                                                            </span>
                                                        ));
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

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

                        {(errors.weeks || (errors.teacher_id && errors.teacher_id.includes('Trùng lịch'))) && (
                            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                                <div>
                                    <p className="font-bold">Lỗi trùng lịch học / lịch dạy trong tuần:</p>
                                    <p className="mt-1 font-normal text-red-700">{errors.weeks || errors.teacher_id}</p>
                                </div>
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
                                                {conf.slots.map((slot, sIdx) => {
                                                    const sStart = slot.start_time ? String(slot.start_time).slice(0, 5) : '';
                                                    const sEnd = slot.end_time ? String(slot.end_time).slice(0, 5) : '';
                                                    const isInvalidTime = !!(sStart && sEnd && sStart >= sEnd);

                                                    let sameDayConflictMsg: string | null = null;
                                                    if (sStart && sEnd) {
                                                        for (let oIdx = 0; oIdx < conf.slots.length; oIdx++) {
                                                            if (oIdx === sIdx) continue;
                                                            const otherSlot = conf.slots[oIdx];
                                                            const oStart = otherSlot.start_time ? String(otherSlot.start_time).slice(0, 5) : '';
                                                            const oEnd = otherSlot.end_time ? String(otherSlot.end_time).slice(0, 5) : '';
                                                            if (oStart && oEnd && sStart < oEnd && oStart < sEnd) {
                                                                sameDayConflictMsg = `Trùng giờ với Ca ${oIdx + 1} (${oStart} - ${oEnd})`;
                                                                break;
                                                            }
                                                        }
                                                    }

                                                    const otherConflict = getSlotConflict(day.id, slot.start_time, slot.end_time);
                                                    const teacherConflict = getTeacherSlotConflict(day.id, slot.start_time, slot.end_time);
                                                    const isConflicted = isInvalidTime || !!sameDayConflictMsg || !!otherConflict || !!teacherConflict;

                                                    return (
                                                        <div
                                                            key={sIdx}
                                                            className={`rounded-xl bg-white p-3 shadow-xs border transition-all ${
                                                                isConflicted
                                                                    ? 'border-red-400 bg-white'
                                                                    : 'border-emerald-200/80 bg-white'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-gray-800">
                                                                <span className="flex items-center gap-1">
                                                                    <span>Ca {sIdx + 1}</span>
                                                                    <span className="font-mono text-gray-500">({sStart || '--:--'} - {sEnd || '--:--'})</span>
                                                                </span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => openSlotModal(day.id, sIdx, e)}
                                                                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-0.5"
                                                                        title="Chỉnh sửa giờ trong popup có nút Lưu"
                                                                    >
                                                                        <Edit3 className="h-3.5 w-3.5" />
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
                                                                    <label className="mb-1 block text-[11px] text-gray-500 font-medium">Bắt đầu</label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => openSlotModal(day.id, sIdx, e)}
                                                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-xs hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors"
                                                                        title="Bấm để chỉnh sửa giờ ca học (Có nút Lưu)"
                                                                    >
                                                                        <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                                        <span>{sStart || '18:00'}</span>
                                                                    </button>
                                                                </div>
                                                                <div>
                                                                    <label className="mb-1 block text-[11px] text-gray-500 font-medium">Kết thúc</label>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => openSlotModal(day.id, sIdx, e)}
                                                                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-gray-900 shadow-xs hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors"
                                                                        title="Bấm để chỉnh sửa giờ ca học (Có nút Lưu)"
                                                                    >
                                                                        <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                                        <span>{sEnd || '20:00'}</span>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {isInvalidTime && (
                                                                <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-red-50 p-2 text-xs font-medium text-red-900 border border-red-200">
                                                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                                                                    <span>Giờ kết thúc ({sEnd}) phải sau giờ bắt đầu ({sStart})!</span>
                                                                </div>
                                                            )}

                                                            {sameDayConflictMsg && (
                                                                <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-red-50 p-2 text-xs font-medium text-red-900 border border-red-200">
                                                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                                                                    <span>{sameDayConflictMsg}</span>
                                                                </div>
                                                            )}

                                                            {otherConflict && (
                                                                <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-red-50 p-2 text-xs font-medium text-red-900 border border-red-200">
                                                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                                                                    <span>Trùng với môn <strong>{otherConflict.subjectName}</strong> ({otherConflict.timeRange})</span>
                                                                </div>
                                                            )}

                                                            {teacherConflict && (
                                                                <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-900 border border-amber-300">
                                                                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                                                                    <span>Trùng lịch dạy GV <strong>{teacherConflict.teacherName}</strong> tại lớp <strong>{teacherConflict.className}</strong> ({teacherConflict.timeRange})</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

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
                        {errors.off_days && (
                            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                <span>{errors.off_days}</span>
                            </div>
                        )}
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
                                                min={classStartDate || undefined}
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

                        {errors.extra_days && (
                            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                <span>{errors.extra_days}</span>
                            </div>
                        )}

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
                                                min={classStartDate || undefined}
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

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href="/schedules">
                            <Button variant="secondary" size="lg">
                                Hủy Bỏ
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            variant="edit"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Lưu Lịch Học
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

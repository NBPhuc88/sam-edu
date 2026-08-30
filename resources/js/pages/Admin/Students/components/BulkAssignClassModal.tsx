import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { router } from '@inertiajs/react';
import { AlertCircle, Check, HelpCircle, Search, Users } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface SchoolClassOption {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

interface Center {
    id: number;
    name: string;
    code: string;
}

interface StudentTuitionItem {
    id: number;
    class_id: number;
}

interface StudentInfo {
    id: number;
    student_code?: string;
    full_name?: string;
    phone?: string | null;
    tuitions?: StudentTuitionItem[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    selectedStudentIds: number[];
    students?: StudentInfo[];
    allClasses: SchoolClassOption[];
    centers: Center[];
    selectedCenterId?: number | null;
}

export default function BulkAssignClassModal({
    isOpen,
    onClose,
    selectedStudentIds = [],
    students = [],
    allClasses = [],
    centers = [],
    selectedCenterId,
}: Props) {
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [filterCenterId, setFilterCenterId] = useState<string>(
        selectedCenterId ? String(selectedCenterId) : (centers[0]?.id ? String(centers[0].id) : '')
    );
    const [search, setSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTuitionConfirm, setShowTuitionConfirm] = useState(false);

    const selectedStudentsList = useMemo(() => {
        return selectedStudentIds.map((id) => {
            const found = students.find((s) => s.id === id);
            return (
                found || {
                    id,
                    full_name: `Học sinh #${id}`,
                    student_code: '',
                    tuitions: [],
                }
            );
        });
    }, [selectedStudentIds, students]);

    // Lọc danh sách học sinh CHƯA ĐƯỢC TẠO HỌC PHÍ cho lớp học được chọn
    const studentsWithoutTuition = useMemo(() => {
        if (!selectedClassId) return selectedStudentsList;
        return selectedStudentsList.filter((s) => {
            const hasTuition = (s.tuitions || []).some(
                (t) => Number(t.class_id) === Number(selectedClassId)
            );
            return !hasTuition;
        });
    }, [selectedStudentsList, selectedClassId]);

    const [selectedTuitionStudentIds, setSelectedTuitionStudentIds] = useState<number[]>([]);

    // Sync filterCenterId when selectedCenterId changes
    React.useEffect(() => {
        if (selectedCenterId) {
            setFilterCenterId(String(selectedCenterId));
        } else if (centers[0]?.id && !filterCenterId) {
            setFilterCenterId(String(centers[0].id));
        }
        if (!isOpen) {
            setShowTuitionConfirm(false);
        }
    }, [selectedCenterId, centers, isOpen]);

    // Filter classes by chosen center
    const availableClasses = useMemo(() => {
        return allClasses.filter((c) => !filterCenterId || Number(c.center_id) === Number(filterCenterId));
    }, [allClasses, filterCenterId]);

    const targetClass = useMemo(() => {
        return allClasses.find((c) => c.id === selectedClassId);
    }, [allClasses, selectedClassId]);

    const filteredClasses = useMemo(() => {
        if (!search.trim()) return availableClasses;
        const term = search.toLowerCase();
        return availableClasses.filter(
            (c) => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
        );
    }, [availableClasses, search]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId) return;

        if (studentsWithoutTuition.length > 0) {
            setSelectedTuitionStudentIds(studentsWithoutTuition.map((s) => s.id));
            setShowTuitionConfirm(true);
        } else {
            // Tất cả học sinh đã có học phí cho lớp này
            executeSubmit(0, []);
        }
    };

    const toggleTuitionStudent = (id: number) => {
        setSelectedTuitionStudentIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllTuitionStudents = () => {
        if (selectedTuitionStudentIds.length === studentsWithoutTuition.length) {
            setSelectedTuitionStudentIds([]);
        } else {
            setSelectedTuitionStudentIds(studentsWithoutTuition.map((s) => s.id));
        }
    };

    const executeSubmit = (createTuition: number, tuitionStudentIds: number[] = []) => {
        if (!selectedClassId) return;

        setIsSubmitting(true);

        router.post(
            '/students/bulk-assign-classes',
            {
                class_id: selectedClassId,
                student_ids: selectedStudentIds,
                create_tuition: createTuition,
                tuition_student_ids: createTuition ? tuitionStudentIds : [],
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setSelectedClassId(null);
                    setShowTuitionConfirm(false);
                    onClose();
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ghi Danh Học Sinh Vào Lớp Học Hàng Loạt"
            maxWidth="3xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold text-emerald-950">
                                Đã chọn {selectedStudentIds.length} học sinh
                            </p>
                            <p className="text-xs text-emerald-700">
                                Chọn lớp học đích để ghi danh toàn bộ học sinh này
                            </p>
                        </div>
                    </div>
                </div>

                {centers.length > 1 && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Trung tâm đào tạo
                        </label>
                        <select
                            className="w-full h-10 px-3 border border-gray-300 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            value={filterCenterId}
                            onChange={(e) => {
                                setFilterCenterId(e.target.value);
                                setSelectedClassId(null);
                            }}
                        >
                            {centers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Chọn lớp học đích <span className="text-red-500">*</span>
                    </label>

                    <div className="mb-2">
                        <Input
                            icon={<Search className="w-4 h-4 text-gray-400" />}
                            placeholder="Tìm kiếm lớp học theo tên hoặc mã..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="!py-2.5 !text-sm"
                        />
                    </div>

                    {availableClasses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 space-y-2 bg-slate-50 rounded-xl border border-slate-200">
                            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                            <p className="font-medium text-gray-800 text-sm">Không có lớp học nào</p>
                            <p className="text-xs">Trung tâm này chưa có lớp học nào đang mở.</p>
                        </div>
                    ) : (
                        <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1.5 border border-gray-200 rounded-xl p-2 bg-slate-50/50">
                            {filteredClasses.length === 0 ? (
                                <p className="text-center py-8 text-sm text-gray-500">
                                    Không tìm thấy lớp học phù hợp với từ khóa "{search}".
                                </p>
                            ) : (
                                filteredClasses.map((cls) => {
                                    const isSelected = selectedClassId === cls.id;
                                    return (
                                        <div
                                            key={cls.id}
                                            onClick={() => setSelectedClassId(cls.id)}
                                            className={`cursor-pointer flex items-center justify-between gap-3.5 p-3 rounded-xl border transition-all select-none ${
                                                isSelected
                                                    ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-500 shadow-xs'
                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div
                                                    className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border transition-colors ${
                                                        isSelected
                                                            ? 'bg-emerald-600 border-emerald-600 text-white'
                                                            : 'border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-semibold text-gray-900 text-sm leading-tight">
                                                            {cls.name}
                                                        </p>
                                                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono font-medium border border-gray-200">
                                                            {cls.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Badge variant="active" className="shrink-0 whitespace-nowrap">Đã chọn</Badge>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Đóng
                    </Button>
                    <Button
                        type="submit"
                        variant="success"
                        isLoading={isSubmitting}
                        disabled={!selectedClassId || selectedStudentIds.length === 0}
                    >
                        Ghi Danh Ngay ({selectedStudentIds.length})
                    </Button>
                </div>
            </form>

            {showTuitionConfirm && (
                <Modal
                    isOpen={showTuitionConfirm}
                    onClose={() => !isSubmitting && setShowTuitionConfirm(false)}
                    title="Xác Nhận Tạo Học Phí Cho Học Sinh"
                    maxWidth="lg"
                >
                    <div className="space-y-4">
                        <div className="flex items-start gap-3.5 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 text-sm">
                                <p className="font-semibold text-gray-900">
                                    Có tạo học phí cho các học sinh chưa có học phí?
                                </p>
                                <p className="text-gray-600 leading-relaxed text-xs">
                                    Lớp <span className="font-semibold text-gray-900">{targetClass?.name || 'đã chọn'}</span> có <span className="font-semibold text-emerald-800">{studentsWithoutTuition.length} học sinh</span> chưa được tạo học phí. Chọn các học sinh bạn muốn tự động sinh hồ sơ học phí:
                                </p>
                            </div>
                        </div>

                        {/* List of students without tuition with checkboxes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <button
                                    type="button"
                                    onClick={handleSelectAllTuitionStudents}
                                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer select-none"
                                >
                                    <div
                                        className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                                            selectedTuitionStudentIds.length === studentsWithoutTuition.length
                                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                                : 'border-gray-300 bg-white'
                                        }`}
                                    >
                                        {selectedTuitionStudentIds.length === studentsWithoutTuition.length && (
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        )}
                                    </div>
                                    Chọn tất cả học sinh ({selectedTuitionStudentIds.length}/{studentsWithoutTuition.length})
                                </button>
                            </div>

                            <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-gray-200">
                                {studentsWithoutTuition.map((st) => {
                                    const isChecked = selectedTuitionStudentIds.includes(st.id);
                                    return (
                                        <div
                                            key={st.id}
                                            onClick={() => toggleTuitionStudent(st.id)}
                                            className={`cursor-pointer flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-all select-none ${
                                                isChecked
                                                    ? 'bg-white border-emerald-400 ring-1 ring-emerald-400/40 shadow-2xs'
                                                    : 'bg-white/60 border-gray-200 hover:bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div
                                                    className={`w-4.5 h-4.5 rounded shrink-0 flex items-center justify-center border transition-colors ${
                                                        isChecked
                                                            ? 'bg-emerald-600 border-emerald-600 text-white'
                                                            : 'border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-semibold text-gray-900 text-xs">
                                                        {st.full_name}
                                                    </span>
                                                </div>
                                            </div>
                                            {st.student_code && (
                                                <span className="shrink-0 text-2xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono border border-gray-200">
                                                    {st.student_code}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowTuitionConfirm(false)}
                                disabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => executeSubmit(0, [])}
                                isLoading={isSubmitting}
                            >
                                Không tạo học phí
                            </Button>
                            <Button
                                type="button"
                                variant="success"
                                onClick={() => executeSubmit(selectedTuitionStudentIds.length > 0 ? 1 : 0, selectedTuitionStudentIds)}
                                isLoading={isSubmitting}
                            >
                                {selectedTuitionStudentIds.length > 0
                                    ? `Có, tạo học phí (${selectedTuitionStudentIds.length} HS)`
                                    : 'Có, tạo học phí'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </Modal>
    );
}

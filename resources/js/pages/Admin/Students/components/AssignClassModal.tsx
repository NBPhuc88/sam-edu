import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { router } from '@inertiajs/react';
import { AlertCircle, Check, HelpCircle, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface SchoolClassOption {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

interface StudentClassTag {
    id: number;
    name: string;
    code: string;
}

interface Student {
    id: number;
    student_code: string;
    full_name: string;
    center_id: number;
    classes?: StudentClassTag[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    allClasses: SchoolClassOption[];
}

export default function AssignClassModal({ isOpen, onClose, student, allClasses = [] }: Props) {
    if (!student) return null;

    // Filter classes belonging to the student's center
    const centerClasses = useMemo(() => {
        return allClasses.filter((c) => Number(c.center_id) === Number(student.center_id));
    }, [allClasses, student.center_id]);

    const initialSelectedIds = useMemo(() => {
        return (student.classes || []).map((c) => c.id);
    }, [student]);

    const [selectedClassIds, setSelectedClassIds] = useState<number[]>(initialSelectedIds);
    const [search, setSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTuitionConfirm, setShowTuitionConfirm] = useState(false);

    // Reset selection when student changes
    React.useEffect(() => {
        if (student) {
            setSelectedClassIds((student.classes || []).map((c) => c.id));
            setSearch('');
            setShowTuitionConfirm(false);
        }
    }, [student]);

    const filteredClasses = useMemo(() => {
        if (!search.trim()) return centerClasses;
        const term = search.toLowerCase();
        return centerClasses.filter(
            (c) => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
        );
    }, [centerClasses, search]);

    const toggleClass = (classId: number) => {
        setSelectedClassIds((prev) =>
            prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
        );
    };

    const handleSelectAll = () => {
        const visibleIds = filteredClasses.map((c) => c.id);
        const allSelected = visibleIds.every((id) => selectedClassIds.includes(id));

        if (allSelected) {
            setSelectedClassIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
        } else {
            setSelectedClassIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
        }
    };

    const newlyAddedClasses = useMemo(() => {
        const newlyAddedIds = selectedClassIds.filter((id) => !initialSelectedIds.includes(id));
        return centerClasses.filter((c) => newlyAddedIds.includes(c.id));
    }, [selectedClassIds, initialSelectedIds, centerClasses]);

    const [selectedTuitionClassIds, setSelectedTuitionClassIds] = useState<number[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newlyAddedIds = selectedClassIds.filter((id) => !initialSelectedIds.includes(id));

        if (newlyAddedIds.length > 0) {
            setSelectedTuitionClassIds(newlyAddedIds);
            setShowTuitionConfirm(true);
        } else {
            executeSubmit(0, []);
        }
    };

    const toggleTuitionClass = (classId: number) => {
        setSelectedTuitionClassIds((prev) =>
            prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
        );
    };

    const handleSelectAllTuitionClasses = () => {
        if (selectedTuitionClassIds.length === newlyAddedClasses.length) {
            setSelectedTuitionClassIds([]);
        } else {
            setSelectedTuitionClassIds(newlyAddedClasses.map((c) => c.id));
        }
    };

    const executeSubmit = (createTuition: number, tuitionClassIds: number[] = []) => {
        setIsSubmitting(true);

        router.post(
            `/students/${student.id}/assign-classes`,
            {
                class_ids: selectedClassIds,
                create_tuition: createTuition,
                tuition_class_ids: createTuition ? tuitionClassIds : [],
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
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
            title={`Phân Lớp Học - ${student.full_name}`}
            maxWidth="3xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Mã học sinh</p>
                        <p className="font-bold text-gray-900 text-base">{student.student_code}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Số lớp đã chọn</p>
                        <Badge variant="active" className="font-semibold">{selectedClassIds.length} lớp học</Badge>
                    </div>
                </div>

                {centerClasses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 space-y-2 bg-slate-50 rounded-xl border border-slate-200">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                        <p className="font-medium text-gray-800">Không có lớp học nào</p>
                        <p className="text-xs">
                            Trung tâm này hiện chưa có lớp học nào đang hoạt động. Vui lòng tạo lớp học trước.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                                <Input
                                    icon={<Search className="w-4 h-4 text-gray-400" />}
                                    placeholder="Tìm theo tên hoặc mã lớp..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="!py-2.5 !text-sm"
                                />
                            </div>
                            {filteredClasses.length > 0 && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="md"
                                    onClick={handleSelectAll}
                                    className="shrink-0"
                                >
                                    {filteredClasses.every((c) => selectedClassIds.includes(c.id))
                                        ? 'Bỏ chọn tất cả'
                                        : 'Chọn tất cả'}
                                </Button>
                            )}
                        </div>

                        <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1.5 border border-gray-200 rounded-xl p-2 bg-slate-50/50">
                            {filteredClasses.length === 0 ? (
                                <p className="text-center py-8 text-sm text-gray-500">
                                    Không tìm thấy lớp học nào khớp với "{search}".
                                </p>
                            ) : (
                                filteredClasses.map((cls) => {
                                    const isSelected = selectedClassIds.includes(cls.id);
                                    return (
                                        <div
                                            key={cls.id}
                                            onClick={() => toggleClass(cls.id)}
                                            className={`cursor-pointer flex items-center justify-between gap-3.5 p-3 rounded-xl border transition-all select-none ${
                                                isSelected
                                                    ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-500 shadow-xs'
                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div
                                                    className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center border transition-colors ${
                                                        isSelected
                                                            ? 'bg-emerald-600 border-emerald-600 text-white'
                                                            : 'border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-semibold text-gray-900 text-sm leading-tight">
                                                            {cls.name}
                                                        </span>
                                                        <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono font-medium border border-gray-200">
                                                            {cls.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={isSelected ? 'active' : 'info'} className="shrink-0 whitespace-nowrap">
                                                {isSelected ? 'Đang học' : 'Chưa ghi danh'}
                                            </Badge>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Đóng
                    </Button>
                    <Button type="submit" variant="success" isLoading={isSubmitting} disabled={centerClasses.length === 0}>
                        Lưu Thay Đổi
                    </Button>
                </div>
            </form>

            {showTuitionConfirm && (
                <Modal
                    isOpen={showTuitionConfirm}
                    onClose={() => !isSubmitting && setShowTuitionConfirm(false)}
                    title="Xác Nhận Tạo Học Phí Cho Lớp Mới"
                    maxWidth="lg"
                >
                    <div className="space-y-4">
                        <div className="flex items-start gap-3.5 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 text-sm">
                                <p className="font-semibold text-gray-900">
                                    Có tạo học phí cho các lớp mới được thêm?
                                </p>
                                <p className="text-gray-600 leading-relaxed text-xs">
                                    Học sinh <span className="font-medium text-gray-900">{student.full_name}</span> được phân vào <span className="font-semibold text-emerald-800">{newlyAddedClasses.length} lớp học mới</span>. Chọn các lớp bạn muốn tự động sinh hồ sơ học phí:
                                </p>
                            </div>
                        </div>

                        {/* List of newly added classes with checkboxes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <button
                                    type="button"
                                    onClick={handleSelectAllTuitionClasses}
                                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer select-none"
                                >
                                    <div
                                        className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                                            selectedTuitionClassIds.length === newlyAddedClasses.length
                                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                                : 'border-gray-300 bg-white'
                                        }`}
                                    >
                                        {selectedTuitionClassIds.length === newlyAddedClasses.length && (
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        )}
                                    </div>
                                    Chọn tất cả lớp mới ({selectedTuitionClassIds.length}/{newlyAddedClasses.length})
                                </button>
                            </div>

                            <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-gray-200">
                                {newlyAddedClasses.map((cls) => {
                                    const isChecked = selectedTuitionClassIds.includes(cls.id);
                                    return (
                                        <div
                                            key={cls.id}
                                            onClick={() => toggleTuitionClass(cls.id)}
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
                                                        {cls.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-2xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono border border-gray-200">
                                                {cls.code}
                                            </span>
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
                                onClick={() => executeSubmit(selectedTuitionClassIds.length > 0 ? 1 : 0, selectedTuitionClassIds)}
                                isLoading={isSubmitting}
                            >
                                {selectedTuitionClassIds.length > 0
                                    ? `Có, tạo học phí (${selectedTuitionClassIds.length} lớp)`
                                    : 'Có, tạo học phí'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </Modal>
    );
}

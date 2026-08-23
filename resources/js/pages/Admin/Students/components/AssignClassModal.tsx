import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Search, GraduationCap, Check, BookOpen, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

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

    // Reset selection when student changes
    React.useEffect(() => {
        if (student) {
            setSelectedClassIds((student.classes || []).map((c) => c.id));
            setSearch('');
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            `/students/${student.id}/assign-classes`,
            { class_ids: selectedClassIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
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
            maxWidth="2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Mã học sinh</p>
                        <p className="font-semibold text-gray-900">{student.student_code}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Số lớp đã chọn</p>
                        <Badge variant="active">{selectedClassIds.length} lớp học</Badge>
                    </div>
                </div>

                {centerClasses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 space-y-2">
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
                                />
                            </div>
                            {filteredClasses.length > 0 && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleSelectAll}
                                >
                                    {filteredClasses.every((c) => selectedClassIds.includes(c.id))
                                        ? 'Bỏ chọn tất cả'
                                        : 'Chọn tất cả'}
                                </Button>
                            )}
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100">
                            {filteredClasses.length === 0 ? (
                                <p className="text-center py-6 text-sm text-gray-500">
                                    Không tìm thấy lớp học nào khớp với "{search}".
                                </p>
                            ) : (
                                filteredClasses.map((cls) => {
                                    const isSelected = selectedClassIds.includes(cls.id);
                                    return (
                                        <div
                                            key={cls.id}
                                            onClick={() => toggleClass(cls.id)}
                                            className={`pt-2 first:pt-0 cursor-pointer flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                isSelected
                                                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                                        isSelected
                                                            ? 'bg-emerald-600 border-emerald-600 text-white'
                                                            : 'border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900 text-sm">
                                                            {cls.name}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono font-medium">
                                                            {cls.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={isSelected ? 'active' : 'info'}>
                                                {isSelected ? 'Đang học' : 'Chưa ghi danh'}
                                            </Badge>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Đóng
                    </Button>
                    <Button type="submit" variant="success" isLoading={isSubmitting} disabled={centerClasses.length === 0}>
                        Lưu Thay Đổi
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

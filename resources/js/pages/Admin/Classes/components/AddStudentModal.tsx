import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Search, UserPlus, AlertCircle, Check, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

interface AvailableStudent {
    id: number;
    full_name: string;
    student_code: string;
    phone: string | null;
    email: string | null;
    status: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    classId: number;
    className: string;
    classCode: string;
}

export default function AddStudentModal({
    isOpen,
    onClose,
    classId,
    className,
    classCode,
}: Props) {
    const [students, setStudents] = useState<AvailableStudent[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch available students when modal opens
    useEffect(() => {
        if (!isOpen) {
            setStudents([]);
            setSelectedStudentIds([]);
            setSearch('');
            return;
        }

        let isMounted = true;
        setIsLoading(true);

        fetch(`/classes/${classId}/students/available?search=${encodeURIComponent(search)}`)
            .then((res) => res.json())
            .then((data) => {
                if (isMounted) {
                    setStudents(data || []);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, classId, search]);

    const toggleStudent = (id: number) => {
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const visibleIds = students.map((s) => s.id);
        const allSelected = visibleIds.every((id) => selectedStudentIds.includes(id));

        if (allSelected) {
            setSelectedStudentIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
        } else {
            setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudentIds.length === 0) return;

        setIsSubmitting(true);

        router.post(
            `/classes/${classId}/students/add`,
            { student_ids: selectedStudentIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setSelectedStudentIds([]);
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
            title={`Thêm Học Sinh Vào Lớp ${className}`}
            maxWidth="3xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Mã lớp học</p>
                        <p className="font-bold text-gray-900 text-base">{classCode}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Đã chọn</p>
                        <Badge variant="active" className="font-semibold">{selectedStudentIds.length} học sinh</Badge>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                        <Input
                            icon={<Search className="w-4 h-4 text-gray-400" />}
                            placeholder="Tìm kiếm theo tên, mã HS, số điện thoại..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="!py-2.5 !text-sm"
                        />
                    </div>
                    {students.length > 0 && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={handleSelectAll}
                            className="shrink-0"
                        >
                            {students.every((s) => selectedStudentIds.includes(s.id))
                                ? 'Bỏ chọn tất cả'
                                : 'Chọn tất cả'}
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        <p className="text-xs">Đang tải danh sách học sinh khả dụng...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 space-y-2 bg-slate-50 rounded-xl border border-slate-200">
                        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                        <p className="font-medium text-gray-800 text-sm">Không tìm thấy học sinh khả dụng</p>
                        <p className="text-xs text-gray-500">
                            Tất cả học sinh trong trung tâm đã được ghi danh hoặc không khớp với từ khóa tìm kiếm.
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1.5 border border-gray-200 rounded-xl p-2 bg-slate-50/50">
                        {students.map((student) => {
                            const isSelected = selectedStudentIds.includes(student.id);
                            return (
                                <div
                                    key={student.id}
                                    onClick={() => toggleStudent(student.id)}
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
                                                    {student.full_name}
                                                </span>
                                                <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono font-medium border border-gray-200">
                                                    {student.student_code}
                                                </span>
                                            </div>
                                            {(student.phone || student.email) && (
                                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                    {[student.phone, student.email].filter(Boolean).join(' • ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant={isSelected ? 'active' : 'info'} className="shrink-0 whitespace-nowrap">
                                        {isSelected ? 'Đã chọn' : 'Chưa chọn'}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Đóng
                    </Button>
                    <Button
                        type="submit"
                        variant="success"
                        isLoading={isSubmitting}
                        disabled={selectedStudentIds.length === 0}
                    >
                        Thêm Vào Lớp ({selectedStudentIds.length})
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

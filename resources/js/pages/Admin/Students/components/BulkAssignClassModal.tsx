import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Search, GraduationCap, Users, AlertCircle, Check } from 'lucide-react';
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

interface Center {
    id: number;
    name: string;
    code: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    selectedStudentIds: number[];
    allClasses: SchoolClassOption[];
    centers: Center[];
    selectedCenterId?: number | null;
}

export default function BulkAssignClassModal({
    isOpen,
    onClose,
    selectedStudentIds = [],
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

    // Sync filterCenterId when selectedCenterId changes
    React.useEffect(() => {
        if (selectedCenterId) {
            setFilterCenterId(String(selectedCenterId));
        } else if (centers[0]?.id && !filterCenterId) {
            setFilterCenterId(String(centers[0].id));
        }
    }, [selectedCenterId, centers]);

    // Filter classes by chosen center
    const availableClasses = useMemo(() => {
        return allClasses.filter((c) => !filterCenterId || Number(c.center_id) === Number(filterCenterId));
    }, [allClasses, filterCenterId]);

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

        setIsSubmitting(true);

        router.post(
            '/students/bulk-assign-classes',
            {
                class_id: selectedClassId,
                student_ids: selectedStudentIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setSelectedClassId(null);
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
                                    {c.name} ({c.code})
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
        </Modal>
    );
}

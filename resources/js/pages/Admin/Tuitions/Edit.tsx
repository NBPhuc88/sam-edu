import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import AppLayout from '../../../layouts/AppLayout';

interface CenterItem {
    id: number;
    name: string;
    code: string;
}

interface ClassItem {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

interface StudentItem {
    id: number;
    full_name: string;
    student_code: string;
    phone: string | null;
    center_id: number;
}

interface EditProps {
    tuition: {
        id: number;
        center_id: number;
        student_id: number;
        class_id: number;
        title: string | null;
        total_amount: number | string;
        paid_amount: number | string;
        remaining_amount: number | string;
        due_date: string | null;
        note: string | null;
        student?: {
            id: number;
            full_name: string;
            student_code: string;
        };
        school_class?: {
            id: number;
            name: string;
            code: string;
        };
        center?: {
            id: number;
            name: string;
            code: string;
        };
    };
    centers: CenterItem[];
    classes: ClassItem[];
    students: StudentItem[];
    errors?: Record<string, string>;
}

export const Edit: React.FC<EditProps> = ({
    tuition,
    centers,
    classes,
    students,
    errors = {},
}) => {
    const [centerId, setCenterId] = useState<string>(String(tuition.center_id));
    const [classId, setClassId] = useState<string>(String(tuition.class_id));
    const [studentId, setStudentId] = useState<string>(String(tuition.student_id));
    const [title, setTitle] = useState<string>(tuition.title || '');
    const [totalAmount, setTotalAmount] = useState<string>(String(tuition.total_amount || 0));
    const [dueDate, setDueDate] = useState<string>(tuition.due_date || '');
    const [note, setNote] = useState<string>(tuition.note || '');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredClasses = classes.filter((c) => String(c.center_id) === String(centerId));
    const filteredStudents = students.filter((s) => String(s.center_id) === String(centerId));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.patch(
            `/tuitions/${tuition.id}`,
            {
                center_id: Number(centerId),
                class_id: Number(classId),
                student_id: Number(studentId),
                title: title || undefined,
                total_amount: Number(totalAmount),
                due_date: dueDate || null,
                note: note || null,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Chỉnh Sửa Hồ Sơ Học Phí - Giáo Dục Sam">
            <Head title="Chỉnh Sửa Hồ Sơ Học Phí" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/tuitions/${tuition.id}`}>
                            <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Chỉnh Sửa Hồ Sơ Học Phí #{tuition.id}
                            </h1>
                            <p className="text-xs text-gray-500">
                                Cập nhật tổng số tiền học phí hoặc thông tin liên quan của học sinh.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Center */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trung Tâm Đào Tạo
                                </label>
                                <select
                                    value={centerId}
                                    onChange={(e) => {
                                        setCenterId(e.target.value);
                                        setClassId('');
                                        setStudentId('');
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    {centers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Class */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Lớp Học (*)
                                </label>
                                <select
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">-- Chọn Lớp học --</option>
                                    {filteredClasses.map((cl) => (
                                        <option key={cl.id} value={cl.id}>
                                            {cl.name} ({cl.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Student */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Học Sinh (*)
                                </label>
                                <select
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">-- Chọn Học sinh --</option>
                                    {filteredStudents.map((st) => (
                                        <option key={st.id} value={st.id}>
                                            {st.full_name} ({st.student_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Title */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tiêu Đề Khoản Thu
                                </label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Tiêu đề học phí..."
                                />
                            </div>

                            {/* Total Amount */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tổng Số Tiền Học Phí Phải Đóng (VNĐ) (*)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    required
                                />
                                {errors.total_amount && (
                                    <p className="mt-1 text-xs text-red-600">{errors.total_amount}</p>
                                )}
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Hạn Chót Đóng Học Phí
                                </label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>

                            {/* Note */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Ghi Chú
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 p-3 text-xs text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={`/tuitions/${tuition.id}`}>
                            <Button variant="secondary" size="md">
                                Hủy Bỏ
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            variant="edit"
                            size="md"
                            isLoading={isSubmitting}
                            icon={<Save className="h-4 w-4" />}
                        >
                            Cập Nhật Hồ Sơ
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default Edit;

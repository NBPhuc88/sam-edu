import Button from '@/components/ui/Button';
import { Head,Link,router } from '@inertiajs/react';
import {
ArrowLeft,
Award,
BookOpen,
Mail,
MapPin,
Phone,
Printer
} from 'lucide-react';
import { useState } from 'react';

interface ExamResultItem {
    id: number;
    exam_name: string;
    subject_name: string;
    class_name: string;
    class_code: string;
    score: number;
    grade: string;
    exam_date: string;
    note: string;
}

interface EnrolledClass {
    id: number;
    name: string;
    code: string;
    start_date?: string | null;
    end_date?: string | null;
    status: number;
}

interface Props {
    student: {
        id: number;
        full_name: string;
        student_code: string;
        date_of_birth?: string | null;
        email?: string | null;
        phone?: string | null;
        gender?: number | null;
        address?: string | null;
        status: number;
    };
    center: {
        name: string;
        code: string;
        phone: string;
        email: string;
        address: string;
    };
    enrolledClasses: EnrolledClass[];
    selectedClassId: number | null;
    selectedClass: EnrolledClass | null;
    results: ExamResultItem[];
    gpa: number;
    academicRanking: string;
    totalExams: number;
    printDate: string;
}

export default function TranscriptPrint({
    student,
    center,
    enrolledClasses = [],
    selectedClassId,
    selectedClass,
    results = [],
    gpa,
    academicRanking,
    totalExams,
    printDate,
}: Props) {
    const [currentClassFilter, setCurrentClassFilter] = useState<string>(
        selectedClassId ? String(selectedClassId) : '',
    );

    const handleClassFilterChange = (classIdStr: string) => {
        setCurrentClassFilter(classIdStr);
        router.get(
            '/student/transcript/print',
            {
                student_id: student.id,
                class_id: classIdStr ? Number(classIdStr) : undefined,
            },
            { preserveState: true },
        );
    };

    const triggerPrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
            <Head title={`Bảng Điểm - ${student.full_name} (${student.student_code})`} />

            {/* Top Toolbar (Hidden when printing) */}
            <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-slate-200 print:hidden">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay Lại
                    </button>

                    {enrolledClasses.length > 1 && (
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                            <span className="text-xs font-semibold text-gray-500">Lọc theo Lớp:</span>
                            <select
                                value={currentClassFilter}
                                onChange={(e) => handleClassFilterChange(e.target.value)}
                                className="rounded-lg border border-gray-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-gray-900 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">Tất cả các lớp học ({enrolledClasses.length} lớp)</option>
                                {enrolledClasses.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} ({cls.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2.5">
                    <Button
                        variant="success"
                        size="md"
                        icon={<Printer className="h-4 w-4" />}
                        onClick={triggerPrint}
                        className="shadow-sm"
                    >
                        In Phiếu Điểm / Lưu PDF
                    </Button>
                </div>
            </div>

            {/* Standard A4 Printable Document Container */}
            <div className="mx-auto max-w-4xl bg-white p-8 sm:p-12 shadow-md rounded-2xl border border-slate-200 print:shadow-none print:border-none print:p-6 print:rounded-none">
                
                {/* 1. Header with Center Info & Logo */}
                <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md font-black text-2xl tracking-wider">
                            {center.code.slice(0, 3)}
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-emerald-950 uppercase">
                                {center.name}
                            </h2>
                            <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                {center.address}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-1">
                                <span className="flex items-center gap-1 font-mono">
                                    <Phone className="h-3 w-3 text-emerald-600" />
                                    {center.phone}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-emerald-600" />
                                    {center.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className="inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200">
                            Mã TT: {center.code}
                        </span>
                        <div className="text-2xs text-gray-400 mt-1 font-mono">
                            Ngày in: {printDate}
                        </div>
                    </div>
                </div>

                {/* 2. Main Title */}
                <div className="text-center my-6 space-y-1">
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
                        PHIẾU BÁO ĐIỂM & KẾT QUẢ HỌC TẬP
                    </h1>
                    <p className="text-sm font-medium text-emerald-700">
                        {selectedClass ? `Lớp Học: ${selectedClass.name} (${selectedClass.code})` : 'Bảng Tổng Hợp Kết Quả Toàn Khóa'}
                    </p>
                </div>

                {/* 3. Student Profile Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-8 text-xs text-gray-800">
                    <div>
                        <span className="text-gray-500 block font-medium">Họ và Tên:</span>
                        <span className="text-sm font-bold text-gray-900">{student.full_name}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block font-medium">Mã Học Sinh:</span>
                        <span className="text-sm font-bold font-mono text-emerald-800">{student.student_code}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block font-medium">Ngày Sinh:</span>
                        <span className="font-semibold">{student.date_of_birth || '—'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block font-medium">Trạng Thái:</span>
                        <span className="font-semibold text-emerald-700">
                            {Number(student.status) === 2 ? 'Đã Tốt Nghiệp' : Number(student.status) === 0 ? 'Tạm Dừng' : 'Đang Theo Học'}
                        </span>
                    </div>
                </div>

                {/* 4. Exam Results Table */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-emerald-600" />
                        Chi Tiết Điểm Số & Bài Kiểm Tra ({totalExams} bài thi)
                    </h3>

                    <div className="overflow-hidden rounded-xl border border-gray-300">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 border-b border-gray-300 text-gray-700 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-3.5 w-12 text-center">STT</th>
                                    <th className="py-3 px-3.5">Tên Bài Kiểm Tra</th>
                                    <th className="py-3 px-3.5">Môn Học</th>
                                    <th className="py-3 px-3.5">Lớp Học</th>
                                    <th className="py-3 px-3.5 text-center w-24">Điểm Số</th>
                                    <th className="py-3 px-3.5 text-center w-28">Đánh Giá</th>
                                    <th className="py-3 px-3.5 text-center w-28">Ngày Thi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {results.length > 0 ? (
                                    results.map((row, idx) => (
                                        <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                                            <td className="py-3 px-3.5 text-center font-mono text-gray-500 font-medium">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3 px-3.5 font-bold text-gray-900">
                                                {row.exam_name}
                                                {row.note && (
                                                    <span className="block text-3xs font-normal text-gray-500 italic mt-0.5">
                                                        {row.note}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3.5 text-gray-700 font-medium">
                                                {row.subject_name}
                                            </td>
                                            <td className="py-3 px-3.5 text-gray-600 font-medium">
                                                {row.class_name}
                                            </td>
                                            <td className="py-3 px-3.5 text-center font-black text-sm font-mono text-emerald-700">
                                                {row.score}
                                            </td>
                                            <td className="py-3 px-3.5 text-center font-bold">
                                                <span className={`inline-block px-2 py-0.5 rounded text-3xs font-bold ${
                                                    row.score >= 8.0 ? 'bg-emerald-100 text-emerald-800' :
                                                    row.score >= 6.5 ? 'bg-blue-100 text-blue-800' :
                                                    row.score >= 5.0 ? 'bg-amber-100 text-amber-800' :
                                                    'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {row.grade}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3.5 text-center font-mono text-gray-500">
                                                {row.exam_date}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                                            Chưa có dữ liệu bài thi nào được ghi nhận cho học sinh này.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 5. Summary & GPA Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-emerald-50/60 border-2 border-emerald-200 mb-12">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-2xs font-bold uppercase tracking-wider text-emerald-800">
                                Điểm Trung Bình Tích Lũy (GPA)
                            </div>
                            <div className="text-2xl font-black text-emerald-950 font-mono">
                                {gpa.toFixed(2)} <span className="text-sm font-semibold text-emerald-700">/ 10.0</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 sm:border-l border-emerald-200 pt-3 sm:pt-0 sm:pl-6">
                        <div>
                            <div className="text-2xs font-bold uppercase tracking-wider text-emerald-800">
                                Xếp Loại Học Lực
                            </div>
                            <div className="text-xl font-black text-emerald-900 uppercase">
                                {academicRanking}
                            </div>
                        </div>
                        <div>
                            <div className="text-2xs font-bold uppercase tracking-wider text-emerald-800">
                                Tổng Số Bài Thi
                            </div>
                            <div className="text-xl font-black text-gray-900 font-mono">
                                {totalExams}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. Signature Block for Print */}
                <div className="grid grid-cols-2 gap-8 text-center pt-6 text-xs text-gray-800">
                    <div className="space-y-16">
                        <div>
                            <span className="font-bold uppercase tracking-wider block text-gray-900">
                                Người Lập Bảng Điểm
                            </span>
                            <span className="text-2xs text-gray-400 italic">(Ký và ghi rõ họ tên)</span>
                        </div>
                        <div className="font-semibold text-gray-700">Ban Đào Tạo</div>
                    </div>

                    <div className="space-y-16">
                        <div>
                            <span className="font-bold uppercase tracking-wider block text-gray-900">
                                Đại Diện Trung Tâm Đào Tạo
                            </span>
                            <span className="text-2xs text-gray-400 italic">(Ký tên và đóng dấu xác nhận)</span>
                        </div>
                        <div className="font-black text-emerald-900 uppercase tracking-wide">
                            {center.name}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

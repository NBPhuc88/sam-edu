import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import AppLayout from '@/layouts/AppLayout';
import { Head,Link,router,usePage } from '@inertiajs/react';
import { ArrowLeft,BookOpen,Save,User } from 'lucide-react';
import React,{ useState } from 'react';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface CreateProps {
    centers: Center[];
    errors?: Record<string, string>;
}

export default function TeacherCreate({ centers = [], errors = {} }: CreateProps) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';
    const userCenterId = auth?.user?.center_id;

    const [centerId, setCenterId] = useState<string>(
        !isSuperAdmin && userCenterId ? String(userCenterId) : (centers[0]?.id ? String(centers[0].id) : '')
    );
    const [fullName, setFullName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('12345678');
    const [phone, setPhone] = useState<string>('');
    const [dateOfBirth, setDateOfBirth] = useState<string>('');
    const [gender, setGender] = useState<number>(1);
    const [hireDate, setHireDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [specialization, setSpecialization] = useState<string>('');
    const [status, setStatus] = useState<number>(1);
    const [note, setNote] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto generate username from full name
    const handleFullNameChange = (val: string) => {
        setFullName(val);

        if (!username) {
            const clean = val
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'd')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')
                .slice(0, 19);

            if (clean) {
                setUsername(clean);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/teachers',
            {
                center_id: centerId,
                full_name: fullName,
                username,
                email,
                password,
                phone,
                date_of_birth: dateOfBirth,
                gender,
                hire_date: hireDate,
                specialization,
                status,
                note,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Thêm Giáo Viên Mới" />

            <div className="mx-auto max-w-5xl space-y-6 pb-12">
                {/* Header & Breadcrumb */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/teachers"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-xs transition-colors hover:bg-gray-50 hover:text-emerald-700"
                            title="Quay lại danh sách"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Thêm Giáo Viên Mới</h1>
                            <p className="text-sm text-gray-500">
                                Khởi tạo tài khoản và hồ sơ thông tin giảng dạy cho giáo viên tại trung tâm.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-5 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <User className="h-5 w-5 text-emerald-600" />
                            1. Thông Tin Cơ Bản & Tài Khoản
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                            {/* Center Selection (Super Admin only) */}
                            {isSuperAdmin && (
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                                        Trung Tâm Đào Tạo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={centerId}
                                        onChange={(e) => setCenterId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                        required
                                    >
                                        <option value="">-- Chọn Trung tâm --</option>
                                        {centers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.center_id && (
                                        <p className="mt-1.5 text-sm text-red-600">{errors.center_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Full Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Họ Và Tên Giáo Viên <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => handleFullNameChange(e.target.value)}
                                    placeholder="Ví dụ: Nguyễn Văn An"
                                    maxLength={50}
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {errors.full_name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.full_name}</p>
                                )}
                            </div>

                            {/* Teacher Code (Auto Generated) */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mã Giáo Viên
                                </label>
                                <Input
                                    value="Hệ thống tự động sinh mã (VD: GV0000001)"
                                    disabled
                                    className="cursor-not-allowed bg-slate-50 !py-3 !text-sm text-gray-500 italic"
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Tên Đăng Nhập (@username) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                                    placeholder="Ví dụ: gv_nguyenan"
                                    maxLength={19}
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {errors.username && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mật Khẩu Đăng Nhập (Mặc định: 12345678)
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    maxLength={20}
                                    className="!py-3 !text-sm"
                                />
                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Địa Chỉ Email
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nguyenvanan@gmail.com"
                                    maxLength={100}
                                    className="!py-3 !text-sm"
                                />
                                {errors.email && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Số Điện Thoại Liên Hệ
                                </label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Ví dụ: 0912345678"
                                    maxLength={15}
                                    className="!py-3 !text-sm"
                                />
                                {errors.phone && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Professional Info Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-5 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            2. Chuyên Môn Giảng Dạy & Trạng Thái
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                            {/* Specialization */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Chuyên Môn Đào Tạo / Bộ Môn Phụ Trách
                                </label>
                                <Input
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    placeholder="Ví dụ: Toán Nâng Cao 10-12, Tiếng Anh IELTS 8.0, Luyện thi đại học..."
                                    className="!py-3 !text-sm"
                                />
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Sinh
                                </label>
                                <DatePicker
                                    value={dateOfBirth}
                                    onChange={(val) => setDateOfBirth(val)}
                                    className="!py-3 !text-sm w-full"
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Giới Tính
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value={1}>Nam</option>
                                    <option value={2}>Nữ</option>
                                    <option value={3}>Khác</option>
                                </select>
                            </div>

                            {/* Hire Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Bắt Đầu Làm Việc
                                </label>
                                <DatePicker
                                    value={hireDate}
                                    onChange={(val) => setHireDate(val)}
                                    className="!py-3 !text-sm w-full"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Trạng Thái Hoạt Động
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value={1}>Đang hoạt động</option>
                                    <option value={0}>Tạm dừng giảng dạy</option>
                                    <option value={2}>Khóa tài khoản</option>
                                </select>
                            </div>

                            {/* Note */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ghi Chú Thêm
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="Bằng cấp, chứng chỉ, kinh nghiệm giảng dạy hoặc ghi chú riêng..."
                                    className="w-full rounded-lg border border-gray-300 p-3.5 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href="/teachers">
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
                            Lưu Giáo Viên
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

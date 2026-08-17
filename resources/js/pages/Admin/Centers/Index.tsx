import { Head, Link, router } from '@inertiajs/react';
import { Building2, Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react';
import React, { useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import AppLayout from '../../../layouts/AppLayout';

interface Center {
    id: number;
    code: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    status: 'active' | 'inactive' | 'expired' | 'suspended';
    subscription_plan: string;
    expires_at: string | null;
    students_count?: number;
    classes_count?: number;
    teachers_count?: number;
}

interface IndexProps {
    centers: {
        data: Center[];
        links: any[];
        total: number;
    };
    filters: {
        search?: string;
    };
}

export const Index: React.FC<IndexProps> = ({ centers, filters }) => {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/centers', { search: searchTerm }, { preserveState: true });
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Bạn có chắc chắn muốn xóa trung tâm "${name}" không?`)) {
            router.delete(`/centers/${id}`);
        }
    };

    return (
        <AppLayout title="Quản lý Danh sách Trung tâm - Giáo dục Sam">
            <Head title="Quản lý Danh sách Trung tâm" />

            <div className="space-y-6">
                {/* Top Header Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <Building2 className="h-7 w-7 text-emerald-600" />
                            Quản Lý Danh Sách Trung Tâm
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Tổng số <strong>{centers.total}</strong> trung tâm
                            đào tạo trên hệ thống
                        </p>
                    </div>
                    <Link href="/centers/create">
                        <Button
                            variant="success"
                            size="md"
                            icon={<Plus className="h-4 w-4" />}
                        >
                            Thêm Trung Tâm Mới
                        </Button>
                    </Link>
                </div>

                {/* Filter & Search Bar */}
                <Card className="p-4">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Tìm kiếm theo mã, tên trung tâm, email, sđt..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={
                                    <Search className="h-4 w-4 text-gray-400" />
                                }
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="md">
                            Tìm Kiếm
                        </Button>
                    </form>
                </Card>

                {/* Centers Table List */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-semibold text-gray-700 uppercase">
                                <tr>
                                    <th className="px-6 py-4">
                                        Mã & Tên Trung Tâm
                                    </th>
                                    <th className="px-6 py-4">Liên Hệ</th>
                                    <th className="px-6 py-4">Gói SaaS</th>
                                    <th className="px-6 py-4">Quy Mô</th>
                                    <th className="px-6 py-4">Hạn Sử Dụng</th>
                                    <th className="px-6 py-4">Trạng Thái</th>
                                    <th className="px-6 py-4 text-right">
                                        Thao Tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {centers.data && centers.data.length > 0 ? (
                                    centers.data.map((center) => (
                                        <tr
                                            key={center.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">
                                                    {center.name}
                                                </div>
                                                <div className="mt-0.5 font-mono text-xs text-gray-400">
                                                    {center.code}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-medium text-gray-800">
                                                    {center.phone ||
                                                        'Chưa cập nhật'}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {center.email || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 uppercase">
                                                    {center.subscription_plan}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <div className="flex items-center gap-3 text-gray-700">
                                                    <span title="Số lớp học">
                                                        <strong>
                                                            {center.classes_count ??
                                                                0}
                                                        </strong>{' '}
                                                        Lớp
                                                    </span>
                                                    <span>•</span>
                                                    <span title="Số học sinh">
                                                        <strong>
                                                            {center.students_count ??
                                                                0}
                                                        </strong>{' '}
                                                        HS
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {center.expires_at ? (
                                                    <div className="flex items-center gap-1.5 text-gray-700">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                        {new Date(
                                                            center.expires_at,
                                                        ).toLocaleDateString(
                                                            'vi-VN',
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Vô thời hạn
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={
                                                        center.status ===
                                                        'active'
                                                            ? 'active'
                                                            : center.status ===
                                                                'expired'
                                                              ? 'danger'
                                                              : 'info'
                                                    }
                                                >
                                                    {center.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/centers/${center.id}/edit`}
                                                    >
                                                        <Button
                                                            variant="edit"
                                                            size="sm"
                                                            icon={
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            }
                                                        >
                                                            Sửa
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        icon={
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                center.id,
                                                                center.name,
                                                            )
                                                        }
                                                    >
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-12 text-center text-gray-500"
                                        >
                                            Chưa tìm thấy trung tâm nào phù hợp.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Pagination Footer */}
                {centers.links && centers.links.length > 3 && (
                    <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
                        <div className="text-xs text-gray-500">
                            Hiển thị <strong>{centers.data.length}</strong> /{' '}
                            <strong>{centers.total}</strong> trung tâm
                        </div>
                        <div className="flex items-center gap-1">
                            {centers.links.map((link, idx) =>
                                link.url ? (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ) : (
                                    <span
                                        key={idx}
                                        className="cursor-not-allowed rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-400"
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ),
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default Index;

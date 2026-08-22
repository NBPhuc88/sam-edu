import React from 'react';
import Badge from '@/components/ui/Badge';

export type EntityType = 'class' | 'student' | 'teacher' | 'center' | 'tuition' | 'exam' | 'general';

interface Props {
    status: number | string;
    entityType?: EntityType;
    customLabel?: string;
    className?: string;
}

export default function StatusBadge({
    status,
    entityType = 'general',
    customLabel,
    className,
}: Props) {
    const numericStatus = typeof status === 'number' ? status : Number(status);

    // Classes: 0: Tạm ngưng, 1: Đang học, 2: Đã hoàn thành
    if (entityType === 'class') {
        if (numericStatus === 1 || status === 'active') {
            return (
                <Badge variant="active" className={className}>
                    {customLabel || 'Đang học'}
                </Badge>
            );
        }
        if (numericStatus === 2 || status === 'completed') {
            return (
                <Badge variant="info" className={className}>
                    {customLabel || 'Đã hoàn thành'}
                </Badge>
            );
        }
        return (
            <Badge variant="danger" className={className}>
                {customLabel || 'Tạm ngưng'}
            </Badge>
        );
    }

    // Students: 0: Tạm ngưng/Khóa, 1: Đang học, 2: Đã tốt nghiệp
    if (entityType === 'student') {
        if (numericStatus === 1 || status === 'active') {
            return (
                <Badge variant="active" className={className}>
                    {customLabel || 'Đang học'}
                </Badge>
            );
        }
        if (numericStatus === 2 || status === 'graduated') {
            return (
                <Badge variant="info" className={className}>
                    {customLabel || 'Đã tốt nghiệp'}
                </Badge>
            );
        }
        return (
            <Badge variant="danger" className={className}>
                {customLabel || 'Tạm khóa / Ngưng'}
            </Badge>
        );
    }

    // Tuition: unpaid, partial, paid, overdue
    if (entityType === 'tuition') {
        const s = String(status).toLowerCase();
        if (s === 'paid') {
            return <Badge variant="active" className={className}>{customLabel || 'Đã thanh toán'}</Badge>;
        }
        if (s === 'partial') {
            return <Badge variant="expired" className={className}>{customLabel || 'Đóng một phần'}</Badge>;
        }
        if (s === 'overdue') {
            return <Badge variant="danger" className={className}>{customLabel || 'Quá hạn'}</Badge>;
        }
        return <Badge variant="info" className={className}>{customLabel || 'Chưa đóng'}</Badge>;
    }

    // General string status
    const s = String(status).toLowerCase();
    if (s === 'active' || s === 'published' || s === 'completed' || s === 'passed' || numericStatus === 1) {
        return <Badge variant="active" className={className}>{customLabel || 'Hoạt động'}</Badge>;
    }
    if (s === 'pending' || s === 'trial' || s === 'draft' || s === 'reviewing') {
        return <Badge variant="pending" className={className}>{customLabel || 'Chờ xử lý'}</Badge>;
    }
    if (s === 'inactive' || s === 'expired' || s === 'failed' || s === 'rejected' || numericStatus === 0) {
        return <Badge variant="danger" className={className}>{customLabel || 'Ngưng hoạt động'}</Badge>;
    }

    return (
        <Badge variant="info" className={className}>
            {customLabel || String(status)}
        </Badge>
    );
}

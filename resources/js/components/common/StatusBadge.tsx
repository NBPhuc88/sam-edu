import Badge from '@/components/ui/Badge';

export type EntityType =
    | 'class'
    | 'student'
    | 'class_student'
    | 'teacher'
    | 'admin'
    | 'center'
    | 'tuition'
    | 'exam'
    | 'class_exam'
    | 'attendance'
    | 'contact'
    | 'general';

interface Props {
    status: number;
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

    // 1. Classes: 0: Tạm ngưng, 1: Đang hoạt động, 2: Đã hoàn thành, 3: Đã đóng
    if (entityType === 'class') {
        if (numericStatus === 1) {
            return <Badge variant="active" className={className}>{customLabel || 'Đang hoạt động'}</Badge>;
        }
        if (numericStatus === 2) {
            return <Badge variant="info" className={className}>{customLabel || 'Đã hoàn thành'}</Badge>;
        }
        if (numericStatus === 3) {
            return <Badge variant="expired" className={className}>{customLabel || 'Đã đóng'}</Badge>;
        }
        return <Badge variant="danger" className={className}>{customLabel || 'Tạm ngưng'}</Badge>;
    }

    // 2. Students: 0: Tạm ngưng/Khóa, 1: Đang học, 2: Đã tốt nghiệp
    if (entityType === 'student') {
        if (numericStatus === 1) {
            return <Badge variant="active" className={className}>{customLabel || 'Đang học'}</Badge>;
        }
        if (numericStatus === 2) {
            return <Badge variant="info" className={className}>{customLabel || 'Đã tốt nghiệp'}</Badge>;
        }
        return <Badge variant="danger" className={className}>{customLabel || 'Tạm khóa / Ngưng'}</Badge>;
    }

    // 3. Class Students: 0: Thôi học, 1: Đang học, 2: Đã hoàn thành, 3: Đã chuyển lớp
    if (entityType === 'class_student') {
        if (numericStatus === 1) {
            return <Badge variant="active" className={className}>{customLabel || 'Đang học'}</Badge>;
        }
        if (numericStatus === 2) {
            return <Badge variant="pending" className={className}>{customLabel || 'Đã hoàn thành'}</Badge>;
        }
        if (numericStatus === 3) {
            return <Badge variant="info" className={className}>{customLabel || 'Đã chuyển lớp'}</Badge>;
        }
        return <Badge variant="danger" className={className}>{customLabel || 'Nghỉ học'}</Badge>;
    }

    // 4. Teachers & Admins: 0: Tạm ngưng/Tạm nghỉ, 1: Đang làm việc/Hoạt động, 2: Đã khóa
    if (entityType === 'teacher' || entityType === 'admin') {
        if (numericStatus === 1) {
            return <Badge variant="active" className={className}>{customLabel || (entityType === 'teacher' ? 'Đang làm việc' : 'Đang hoạt động')}</Badge>;
        }
        if (numericStatus === 2) {
            return <Badge variant="danger" className={className}>{customLabel || 'Đã khóa'}</Badge>;
        }
        return <Badge variant="pending" className={className}>{customLabel || (entityType === 'teacher' ? 'Tạm nghỉ' : 'Tạm ngưng')}</Badge>;
    }

    // 5. Centers: 0: Bị khóa, 1: Đang hoạt động, 2: Dùng thử, 3: Chờ thanh toán, 4: Hết hạn
    if (entityType === 'center') {
        if (numericStatus === 1) {
            return <Badge variant="active" className={className}>{customLabel || 'Đang hoạt động'}</Badge>;
        }
        if (numericStatus === 2) {
            return <Badge variant="pending" className={className}>{customLabel || 'Dùng thử'}</Badge>;
        }
        if (numericStatus === 3) {
            return <Badge variant="pending" className={className}>{customLabel || 'Chờ thanh toán'}</Badge>;
        }
        if (numericStatus === 4) {
            return <Badge variant="expired" className={className}>{customLabel || 'Hết hạn'}</Badge>;
        }
        return <Badge variant="danger" className={className}>{customLabel || 'Bị khóa'}</Badge>;
    }

    // 6. Tuition: 0: Chưa đóng, 1: Đã hoàn tất, 2: Đóng một phần, 3: Quá hạn
    if (entityType === 'tuition') {
        if (numericStatus === 1) {
            return <Badge variant="active" className={className}>{customLabel || 'Đã hoàn tất'}</Badge>;
        }
        if (numericStatus === 2) {
            return <Badge variant="expired" className={className}>{customLabel || 'Đóng một phần'}</Badge>;
        }
        if (numericStatus === 3) {
            return <Badge variant="danger" className={className}>{customLabel || 'Quá hạn'}</Badge>;
        }
        return <Badge variant="info" className={className}>{customLabel || 'Chưa đóng'}</Badge>;
    }

    // 7. Attendances: 1: Có mặt, 2: Vắng mặt, 3: Đi muộn, 4: Có phép
    if (entityType === 'attendance') {
        if (numericStatus === 1) {
            return <Badge variant="active" className={className}>{customLabel || 'Có mặt'}</Badge>;
        }
        if (numericStatus === 2) {
            return <Badge variant="danger" className={className}>{customLabel || 'Vắng mặt'}</Badge>;
        }
        if (numericStatus === 3) {
            return <Badge variant="pending" className={className}>{customLabel || 'Đi muộn'}</Badge>;
        }
        if (numericStatus === 4) {
            return <Badge variant="info" className={className}>{customLabel || 'Có phép'}</Badge>;
        }
    }

    // 8. Contact Requests: 0: Chờ liên hệ, 1: Đã liên hệ, 2: Đã xử lý xong, 3: Hủy bỏ
    if (entityType === 'contact') {
        if (numericStatus === 2) {
            return <Badge variant="active" className={className}>{customLabel || 'Đã xử lý'}</Badge>;
        }
        if (numericStatus === 1) {
            return <Badge variant="info" className={className}>{customLabel || 'Đã liên hệ'}</Badge>;
        }
        if (numericStatus === 3) {
            return <Badge variant="danger" className={className}>{customLabel || 'Đã hủy'}</Badge>;
        }
        return <Badge variant="pending" className={className}>{customLabel || 'Chờ liên hệ'}</Badge>;
    }

    // 9. General fallback
    if (numericStatus === 1) {
        return <Badge variant="active" className={className}>{customLabel || 'Hoạt động'}</Badge>;
    }
    if (numericStatus === 0) {
        return <Badge variant="danger" className={className}>{customLabel || 'Ngưng hoạt động'}</Badge>;
    }

    return (
        <Badge variant="info" className={className}>
            {customLabel || String(status)}
        </Badge>
    );
}

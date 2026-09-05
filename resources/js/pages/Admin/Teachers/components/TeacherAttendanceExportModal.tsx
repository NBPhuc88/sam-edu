import { exportAttendanceZip } from '@/actions/App/Http/Controllers/TeacherController';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    centers: { id: number; name: string; code: string }[];
    isSuperAdmin: boolean;
}

export default function TeacherAttendanceExportModal({ isOpen, onClose, centers, isSuperAdmin }: Props) {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [centerId, setCenterId] = useState(0);
    const validYear = /^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= 2100;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Báo cáo chấm công" footer={
            <Button variant="export" disabled={!validYear} onClick={() => {
                window.location.href = exportAttendanceZip.url({ query: {
                    month, year: Number(year), center_id: isSuperAdmin && centerId ? centerId : undefined,
                } });
            }}>Tải Tệp Nén ZIP (.zip)</Button>
        }>
            <div className="space-y-4">
                <label className="block space-y-2 text-sm font-medium">
                    <span>Tháng</span>
                    <ScrollableSelect value={month} onChange={(value) => setMonth(Number(value))}
                        options={Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: `Tháng ${index + 1}` }))} />
                </label>
                <label className="block space-y-2 text-sm font-medium">
                    <span>Năm (2000–2100)</span>
                    <Input type="number" min={2000} max={2100} value={year} onChange={(event) => setYear(event.target.value)} />
                </label>
                {isSuperAdmin && <label className="block space-y-2 text-sm font-medium">
                    <span>Trung tâm</span>
                    <ScrollableSelect value={centerId} onChange={(value) => setCenterId(Number(value))} options={[
                        { value: 0, label: 'Tất cả Trung tâm' },
                        ...centers.map((center) => ({ value: center.id, label: `${center.name} (${center.code})` })),
                    ]} />
                </label>}
                <p className="text-sm text-gray-500">Chỉ xuất các ca đã diễn ra hoặc có kết quả (không bao gồm ca dự kiến). Dòng tổng kết tính trên các ca đã hoàn thành.</p>
            </div>
        </Modal>
    );
}

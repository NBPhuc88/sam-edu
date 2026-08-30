import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import apiClient from '@/lib/axios';
import { AlertTriangle,Loader2,Trash2 } from 'lucide-react';
import React,{ useEffect,useState } from 'react';

export interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    entity: 'classes' | 'centers' | 'subjects' | 'teachers' | 'students' | 'exams' | 'rooms' | string;
    entityId: number | null;
    entityName: string;
    isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    entity,
    entityId,
    entityName,
    isDeleting = false,
}) => {
    const [loading, setLoading] = useState(false);
    const [impacts, setImpacts] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && entityId) {
            setLoading(true);
            setImpacts([]);

            apiClient
                .get(`/api/${entity}/${entityId}/delete-impact`)
                .then((res) => {
                    if (res.data?.impacts) {
                        setImpacts(res.data.impacts);
                    }
                })
                .catch(() => {
                    // Fallback
                    setImpacts([]);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, entity, entityId]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Xác nhận xóa dữ liệu"
            maxWidth="md"
            footer={
                <div className="flex items-center justify-end gap-3 w-full">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        size="md"
                        onClick={onConfirm}
                        disabled={isDeleting || loading}
                        icon={isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    >
                        {isDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">
                            Bạn có chắc chắn muốn xóa {entityName}?
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                            Thao tác này sẽ xóa bản ghi khỏi hệ thống.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        <span>Đang kiểm tra dữ liệu liên quan...</span>
                    </div>
                ) : (
                    impacts.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 space-y-2">
                            <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <span>⚠️ Cảnh báo: Việc xóa này sẽ tự động ảnh hưởng đến:</span>
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-xs text-amber-800 font-medium">
                                {impacts.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )
                )}
            </div>
        </Modal>
    );
};

export default DeleteConfirmModal;

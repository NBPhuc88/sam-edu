import Button from '@/components/ui/Button';
import { Link } from '@inertiajs/react';
import { ArrowLeft,Loader2,Save } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
    cancelHref?: string;
    onCancel?: () => void;
    cancelText?: string;
    submitText?: string;
    isSubmitting?: boolean;
    isEdit?: boolean;
    extraActions?: ReactNode;
    sticky?: boolean;
}

export default function FormFooterActions({
    cancelHref,
    onCancel,
    cancelText = 'Hủy bỏ',
    submitText,
    isSubmitting = false,
    isEdit = false,
    extraActions,
    sticky = false,
}: Props) {
    const defaultSubmitText = isEdit ? 'Cập nhật' : 'Lưu lại';

    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200 ${
                sticky
                    ? 'sticky bottom-0 bg-white/95 backdrop-blur-xs p-4 rounded-b-2xl shadow-md z-20'
                    : ''
            }`}
        >
            <div>
                {cancelHref ? (
                    <Link href={cancelHref}>
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={isSubmitting}
                            icon={<ArrowLeft className="h-4 w-4" />}
                        >
                            {cancelText}
                        </Button>
                    </Link>
                ) : onCancel ? (
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={isSubmitting}
                        onClick={onCancel}
                        icon={<ArrowLeft className="h-4 w-4" />}
                    >
                        {cancelText}
                    </Button>
                ) : null}
            </div>

            <div className="flex items-center gap-3">
                {extraActions}

                <Button
                    type="submit"
                    variant={isEdit ? 'edit' : 'success'}
                    disabled={isSubmitting}
                    icon={
                        isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )
                    }
                >
                    {isSubmitting ? 'Đang lưu...' : (submitText || defaultSubmitText)}
                </Button>
            </div>
        </div>
    );
}

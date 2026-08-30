import { ArrowLeft } from 'lucide-react';
import React from 'react';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { Button, ButtonProps } from './Button';

export interface BackButtonProps extends Omit<ButtonProps, 'type'> {
    fallbackUrl?: string;
    label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
    fallbackUrl = '/',
    label = 'Quay Lại',
    variant = 'secondary',
    size = 'sm',
    icon = <ArrowLeft className="h-4 w-4" />,
    onClick,
    children,
    ...props
}) => {
    const { goBack } = useBackNavigation();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick) {
            onClick(e);
        }
        if (!e.defaultPrevented) {
            goBack(fallbackUrl);
        }
    };

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            icon={icon}
            onClick={handleClick}
            {...props}
        >
            {children || label}
        </Button>
    );
};

export default BackButton;

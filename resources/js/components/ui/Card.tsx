import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, description, headerAction, children, className, ...props }) => {
    return (
        <div className={clsx('ui-card p-6', className)} {...props}>
            {(title || description || headerAction) && (
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                    <div>
                        {title && <h3 className="text-base font-bold text-gray-900">{title}</h3>}
                        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div>{children}</div>
        </div>
    );
};

export default Card;

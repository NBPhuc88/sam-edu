import React from 'react';

export interface AppLogoProps {
    /**
     * Kích thước định sẵn của logo
     * @default 'md'
     */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    /**
     * Chữ hiển thị trong emblem (mặc định là SAM)
     * @default 'SAM'
     */
    text?: string;
    /**
     * Tùy biến CSS class thêm
     */
    className?: string;
    /**
     * Hiển thị kèm tên thương hiệu bên cạnh logo
     * @default false
     */
    withText?: boolean;
    /**
     * Tiêu đề thương hiệu (khi withText = true)
     * @default 'Giáo dục Sam'
     */
    brandName?: string;
    /**
     * Phụ đề thương hiệu (khi withText = true)
     */
    subtitle?: string;
    /**
     * Màu chữ của text (khi withText = true)
     * @default 'dark'
     */
    textColor?: 'dark' | 'light';
    /**
     * Tùy chọn ảnh thay vì chữ (nếu muốn)
     */
    src?: string;
}

const sizeClasses = {
    xs: 'h-6 w-6 rounded-md text-[10px]',
    sm: 'h-8 w-8 rounded-lg text-xs',
    md: 'h-9 w-9 rounded-xl text-sm',
    lg: 'h-12 w-12 rounded-xl text-lg',
    xl: 'h-16 w-16 rounded-2xl text-2xl font-black',
    '2xl': 'h-20 w-20 rounded-3xl text-3xl font-black',
};

export const AppLogo: React.FC<AppLogoProps> = ({
    size = 'md',
    text = 'SAM',
    className = '',
    withText = false,
    brandName = 'Giáo dục Sam',
    subtitle,
    textColor = 'dark',
    src,
}) => {
    const emblemElement = src ? (
        <img
            src={src}
            alt={brandName}
            className={`shrink-0 object-contain bg-white p-0.5 shadow-2xs border border-gray-100/80 ${sizeClasses[size] || sizeClasses.md} ${className}`}
        />
    ) : (
        <div
            className={`flex shrink-0 select-none items-center justify-center bg-emerald-600 font-black text-white shadow-xs tracking-wider ${
                sizeClasses[size] || sizeClasses.md
            } ${className}`}
        >
            {text}
        </div>
    );

    if (!withText) {
        return emblemElement;
    }

    const isLight = textColor === 'light';

    return (
        <div className="flex items-center gap-2.5">
            {emblemElement}
            <div className="flex flex-col">
                <span
                    className={`font-extrabold leading-tight tracking-tight ${
                        isLight ? 'text-white' : 'text-gray-900'
                    } ${size === 'lg' || size === 'xl' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}`}
                >
                    {brandName}
                </span>
                {subtitle && (
                    <span
                        className={`text-2xs font-medium ${
                            isLight ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    >
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
};

export default AppLogo;

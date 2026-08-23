import React from 'react';

export interface AppLogoProps {
    /**
     * Kích thước định sẵn của logo
     * @default 'md'
     */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    /**
     * Đường dẫn file logo (mặc định lấy từ /logo.png)
     * @default '/logo.png'
     */
    src?: string;
    /**
     * Văn bản thay thế
     * @default 'SAM-EDU Logo'
     */
    alt?: string;
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
}

const sizeClasses = {
    xs: 'h-6 w-6 rounded-md',
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
    lg: 'h-12 w-12 rounded-xl',
    xl: 'h-16 w-16 rounded-2xl',
    '2xl': 'h-20 w-20 rounded-3xl',
};

export const AppLogo: React.FC<AppLogoProps> = ({
    size = 'md',
    src = '/logo.png',
    alt = 'SAM-EDU Logo',
    className = '',
    withText = false,
    brandName = 'Giáo dục Sam',
    subtitle,
    textColor = 'dark',
}) => {
    const imgElement = (
        <img
            src={src}
            alt={alt}
            className={`shrink-0 object-contain bg-white p-0.5 shadow-2xs border border-gray-100/80 ${sizeClasses[size] || sizeClasses.md} ${className}`}
        />
    );

    if (!withText) {
        return imgElement;
    }

    const isLight = textColor === 'light';

    return (
        <div className="flex items-center gap-2.5">
            {imgElement}
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

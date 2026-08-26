import React, { useState } from 'react';

export interface SeoImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    fallbackSrc?: string;
    aspectRatio?: string;
    className?: string;
}

export const SeoImage: React.FC<SeoImageProps> = ({
    src,
    alt,
    width,
    height,
    fallbackSrc = '/favicon.svg',
    aspectRatio,
    className = '',
    loading = 'lazy',
    decoding = 'async',
    ...props
}) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            setImgSrc(fallbackSrc);
        }
    };

    const style: React.CSSProperties = {
        ...(aspectRatio ? { aspectRatio } : {}),
        ...props.style,
    };

    return (
        <img
            src={imgSrc}
            alt={alt || 'SAM EDU Image'}
            width={width}
            height={height}
            loading={loading}
            decoding={decoding}
            onError={handleError}
            style={style}
            className={`transition-opacity duration-300 ${className}`}
            {...props}
        />
    );
};

export default SeoImage;

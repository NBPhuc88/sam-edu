import { Head } from '@inertiajs/react';
import React from 'react';

export interface SeoHeadProps {
    title: string;
    description?: string;
    keywords?: string;
    canonical?: string;
    ogImage?: string;
    ogType?: 'website' | 'article' | 'product';
    noindex?: boolean;
    schemaJson?: object | object[];
}

export const SeoHead: React.FC<SeoHeadProps> = ({
    title,
    description = 'SAM EDU - Phần mềm Quản lý Đa Trung Tâm Giáo Dục chuyên nghiệp, quản lý học sinh, lớp học, điểm danh và học phí tối ưu.',
    keywords = 'quản lý trung tâm giáo dục, phần mềm quản lý trung tâm tiếng anh, phần mềm điểm danh học sinh, quản lý học phí',
    canonical,
    ogImage = 'https://www.samedu.io.vn/og-banner.png',
    ogType = 'website',
    noindex = false,
    schemaJson,
}) => {
    const siteUrl = 'https://www.samedu.io.vn';
    const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : siteUrl);
    const fullTitle = title.includes('SAM EDU') ? title : `${title} | SAM EDU - Quản Lý Giáo Dục`;

    return (
        <Head>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={canonicalUrl} />

            {/* Robots directive */}
            <meta
                name="robots"
                content={
                    noindex
                        ? 'noindex, nofollow'
                        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
                }
            />

            {/* Open Graph Tags */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:type" content={ogType} />
            <meta property="og:site_name" content="SAM EDU" />
            <meta property="og:locale" content="vi_VN" />

            {/* Twitter Card Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Schema.org JSON-LD */}
            {schemaJson && (
                <script type="application/ld+json">
                    {JSON.stringify(schemaJson)}
                </script>
            )}
        </Head>
    );
};

export default SeoHead;

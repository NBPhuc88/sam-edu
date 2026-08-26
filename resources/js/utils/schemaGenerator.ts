export interface SchemaOrganizationParams {
    name?: string;
    url?: string;
    logo?: string;
    contactPointPhone?: string;
    contactPointEmail?: string;
    sameAs?: string[];
}

export interface SchemaCourseParams {
    name: string;
    description: string;
    providerName?: string;
    providerUrl?: string;
}

export interface SchemaFaqItem {
    question: string;
    answer: string;
}

export interface SchemaBreadcrumbItem {
    name: string;
    url: string;
}

/**
 * Sinh Schema JSON-LD cho Doanh nghiệp / Tổ chức (Organization)
 */
export function generateOrganizationSchema(params: SchemaOrganizationParams = {}) {
    const baseUrl = params.url || 'https://sam-edu.vn';
    return {
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        'name': params.name || 'SAM EDU - Hệ Thống Quản Lý Giáo Dục Đa Trung Tâm',
        'url': baseUrl,
        'logo': params.logo || `${baseUrl}/logo.png`,
        'contactPoint': {
            '@type': 'ContactPoint',
            'telephone': params.contactPointPhone || '+84-900-000-000',
            'contactType': 'customer service',
            'email': params.contactPointEmail || 'contact@sam-edu.vn',
            'areaServed': 'VN',
            'availableLanguage': ['Vietnamese', 'English'],
        },
        'sameAs': params.sameAs || [
            'https://facebook.com/samedu.official',
            'https://linkedin.com/company/sam-edu',
        ],
    };
}

/**
 * Sinh Schema JSON-LD cho Website (WebSite Search)
 */
export function generateWebSiteSchema(baseUrl: string = 'https://sam-edu.vn') {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'SAM EDU',
        'url': baseUrl,
        'potentialAction': {
            '@type': 'SearchAction',
            'target': `${baseUrl}/services?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };
}

/**
 * Sinh Schema JSON-LD cho Khóa học / Chương trình đào tạo (Course)
 */
export function generateCourseSchema(params: SchemaCourseParams) {
    const baseUrl = params.providerUrl || 'https://sam-edu.vn';
    return {
        '@context': 'https://schema.org',
        '@type': 'Course',
        'name': params.name,
        'description': params.description,
        'provider': {
            '@type': 'Organization',
            'name': params.providerName || 'SAM EDU',
            'sameAs': baseUrl,
        },
    };
}

/**
 * Sinh Schema JSON-LD cho Câu hỏi thường gặp (FAQPage)
 */
export function generateFaqSchema(faqs: SchemaFaqItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqs.map((faq) => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer,
            },
        })),
    };
}

/**
 * Sinh Schema JSON-LD cho Sơ đồ đường dẫn (BreadcrumbList)
 */
export function generateBreadcrumbSchema(items: SchemaBreadcrumbItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': items.map((item, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': item.name,
            'item': item.url,
        })),
    };
}

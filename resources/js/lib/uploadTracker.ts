import apiClient from '@/lib/axios';

export interface PendingUploadMeta {
    previewUrl: string;
    file: File;
    objectType: string;
    objectId?: string | number | null;
    subId?: string | null;
    folder?: string;
}

const pendingUploadsMap = new Map<string, PendingUploadMeta>();

/**
 * Register a local file with its blob preview URL for deferred upload on save
 */
export const registerPendingUpload = (
    previewUrl: string,
    file: File,
    meta: {
        objectType?: string;
        objectId?: string | number | null;
        subId?: string | null;
        folder?: string;
    } = {}
) => {
    pendingUploadsMap.set(previewUrl, {
        previewUrl,
        file,
        objectType: meta.objectType || 'exam_question',
        objectId: meta.objectId || 'general',
        subId: meta.subId || null,
        folder: meta.folder || 'exams/media',
    });
};

/**
 * Unregister and clean up preview URL
 */
export const unregisterPendingUpload = (previewUrl: string) => {
    if (pendingUploadsMap.has(previewUrl)) {
        try {
            URL.revokeObjectURL(previewUrl);
        } catch (_) { }
        pendingUploadsMap.delete(previewUrl);
    }
};

/**
 * Check if a URL is a pending local blob URL
 */
export const isPendingBlobUrl = (url: string | null | undefined): boolean => {
    return Boolean(url && typeof url === 'string' && url.startsWith('blob:'));
};

/**
 * Upload all pending files referenced in an object / data tree and replace blob URLs with server URLs
 */
export const uploadPendingMediaInObject = async <T>(
    data: T,
    onProgress?: (completed: number, total: number) => void
): Promise<T> => {
    if (!data) return data;

    const jsonStr = JSON.stringify(data);

    // Find all registered pending uploads that are referenced anywhere inside the data structure
    const activePendingList: PendingUploadMeta[] = [];
    for (const [previewUrl, item] of pendingUploadsMap.entries()) {
        if (jsonStr.includes(previewUrl)) {
            activePendingList.push(item);
        }
    }

    if (activePendingList.length === 0) {
        return data;
    }

    const urlReplacements = new Map<string, string>();
    const total = activePendingList.length;
    let completed = 0;

    for (const item of activePendingList) {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('object_type', item.objectType);
        formData.append('object_id', String(item.objectId || 'general'));
        if (item.subId) {
            formData.append('sub_id', item.subId);
        }
        formData.append('folder', item.folder || 'exams/media');

        try {
            const res = await apiClient.post('/api/uploads/media', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data?.url) {
                urlReplacements.set(item.previewUrl, res.data.url);
                try {
                    URL.revokeObjectURL(item.previewUrl);
                } catch (_) { }
                pendingUploadsMap.delete(item.previewUrl);
            }
        } catch (err) {
            console.error('[uploadPendingMediaInObject] Failed to upload pending file:', item, err);
            throw err;
        }

        completed++;
        onProgress?.(completed, total);
    }

    if (urlReplacements.size === 0) {
        return data;
    }

    let replacedJson = jsonStr;
    urlReplacements.forEach((realUrl, previewUrl) => {
        replacedJson = replacedJson.split(previewUrl).join(realUrl);
    });

    return JSON.parse(replacedJson);
};

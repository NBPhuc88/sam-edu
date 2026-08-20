/**
 * Utility to extract only modified (dirty) fields between initial data and current form values.
 * Used across the system to ensure update APIs only receive changed parameters.
 */
export function getDirtyFields<T extends Record<string, any>>(
    initialData: T | null | undefined,
    currentData: T,
): Partial<T> {
    if (!initialData) {
        return { ...currentData };
    }

    const dirty: Partial<T> = {};

    for (const key of Object.keys(currentData) as Array<keyof T>) {
        const initialVal = initialData[key];
        const currentVal = currentData[key];

        // Deep check for arrays or objects
        if (typeof currentVal === 'object' && currentVal !== null) {
            if (JSON.stringify(initialVal) !== JSON.stringify(currentVal)) {
                dirty[key] = currentVal;
            }
        } else if (currentVal !== initialVal) {
            // Handle numeric / string empty equivalence if desired, or exact match
            const isBothEmpty =
                (initialVal === null || initialVal === undefined || initialVal === '') &&
                (currentVal === null || currentVal === undefined || currentVal === '');

            if (!isBothEmpty) {
                dirty[key] = currentVal;
            }
        }
    }

    return dirty;
}

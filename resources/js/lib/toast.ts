/**
 * Global Toast Notification Helper
 * Dispatches custom events to AppLayout Toast system
 */

export const notify = {
    success: (message: string) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type: 'success' } }));
        }
    },
    error: (message: string) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type: 'error' } }));
        }
    },
    warning: (message: string) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type: 'warning' } }));
        }
    },
    info: (message: string) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type: 'info' } }));
        }
    },
};

export default notify;

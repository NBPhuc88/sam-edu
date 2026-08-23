import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Gán Pusher vào window scope cho Laravel Echo
declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

window.Pusher = Pusher;

export const getEcho = (): Echo<any> => {
    if (typeof window === 'undefined') {
        return {} as Echo<any>;
    }

    if (!window.Echo) {
        const isReverb = Boolean(import.meta.env.VITE_REVERB_APP_KEY);
        const appKey = import.meta.env.VITE_REVERB_APP_KEY || import.meta.env.VITE_PUSHER_APP_KEY || 'app-key';
        const wsHost =
            import.meta.env.VITE_REVERB_HOST ||
            import.meta.env.VITE_PUSHER_HOST ||
            (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
        const wsPort = Number(import.meta.env.VITE_REVERB_PORT || import.meta.env.VITE_PUSHER_PORT || 8080);
        const wssPort = Number(import.meta.env.VITE_REVERB_PORT || import.meta.env.VITE_PUSHER_PORT || 8080);
        const scheme = import.meta.env.VITE_REVERB_SCHEME || import.meta.env.VITE_PUSHER_SCHEME || 'http';
        const forceTLS = scheme === 'https';
        const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1';

        window.Echo = new Echo({
            broadcaster: isReverb ? 'reverb' : 'pusher',
            key: appKey,
            wsHost: wsHost,
            wsPort: wsPort,
            wssPort: wssPort,
            forceTLS: forceTLS,
            encrypted: forceTLS,
            cluster: cluster,
            disableStats: true,
            enabledTransports: ['ws', 'wss'],
        });
    }

    return window.Echo;
};

export default getEcho;

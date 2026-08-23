import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Gán Pusher vào window scope cho Laravel Echo
declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<'pusher'>;
    }
}

window.Pusher = Pusher;

const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY || 'app-key';
const wsHost = import.meta.env.VITE_PUSHER_HOST || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
const wsPort = Number(import.meta.env.VITE_PUSHER_PORT || 6001);
const forceTLS = import.meta.env.VITE_PUSHER_SCHEME === 'https';

export const getEcho = (): Echo<'pusher'> => {
    if (typeof window === 'undefined') {
        return {} as Echo<'pusher'>;
    }

    if (!window.Echo) {
        window.Echo = new Echo({
            broadcaster: 'pusher',
            key: pusherKey,
            wsHost: wsHost,
            wsPort: wsPort,
            wssPort: wsPort,
            forceTLS: forceTLS,
            encrypted: forceTLS,
            disableStats: true,
            enabledTransports: ['ws', 'wss'],
        });
    }

    return window.Echo;
};

export default getEcho;

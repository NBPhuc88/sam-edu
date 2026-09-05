import { useEffect, useRef, useState } from 'react';
export default function ArenaSoundToggle({
    countdown,
}: {
    countdown: number | null;
}) {
    const audio = useRef<AudioContext | null>(null);
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        if (!enabled || countdown === null || countdown <= 0 || !audio.current) {
return;
}

        const context = audio.current;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = countdown === 1 ? 880 : 440;
        gain.gain.setValueAtTime(0.12, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            context.currentTime + 0.18,
        );
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);

        return () => {
            oscillator.disconnect();
            gain.disconnect();
        };
    }, [countdown, enabled]);
    useEffect(
        () => () => {
            void audio.current?.close();
        },
        [],
    );

    return (
        <button
            className="rounded-full border border-white/20 px-4 py-2 text-xs"
            onClick={() => {
                if (!enabled) {
                    audio.current ??= new AudioContext();
                    void audio.current.resume();
                }

                setEnabled(!enabled);
            }}
        >
            Âm thanh: {enabled ? 'Bật' : 'Tắt'}
        </button>
    );
}

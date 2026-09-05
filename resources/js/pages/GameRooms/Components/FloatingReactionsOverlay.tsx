export default function FloatingReactionsOverlay({
    reactions,
}: {
    reactions: { id: number; emoji: string }[];
}) {
    return (
        <div
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
            aria-hidden="true"
        >
            {reactions.map((reaction) => (
                <span
                    key={reaction.id}
                    className="arena-reaction absolute bottom-0 text-5xl"
                    style={{ left: `${15 + (reaction.id % 70)}%` }}
                >
                    {reaction.emoji}
                </span>
            ))}
        </div>
    );
}

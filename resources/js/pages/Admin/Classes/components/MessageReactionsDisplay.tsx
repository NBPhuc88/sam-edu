import React from 'react';

export interface ReactionItem {
    emoji: string;
    count: number;
    users: Array<{
        sender_type: number;
        sender_id: number;
        sender_name: string;
    }>;
}

interface Props {
    reactions: ReactionItem[];
    currentUserId: number;
    currentUserType: number;
    onToggleReaction: (emoji: string) => void;
    isSelf: boolean;
}

export const MessageReactionsDisplay: React.FC<Props> = ({
    reactions,
    currentUserId,
    currentUserType,
    onToggleReaction,
    isSelf,
}) => {
    if (!reactions || reactions.length === 0) {
        return null;
    }

    return (
        <div
            className={`flex flex-wrap items-center gap-1 mt-1 select-none z-10 ${
                isSelf ? 'justify-end' : 'justify-start'
            }`}
        >
            {reactions.map((r) => {
                const hasReacted = r.users.some(
                    (u) =>
                        u.sender_id === currentUserId &&
                        u.sender_type === currentUserType
                );

                const userNames = r.users
                    .map((u) =>
                        u.sender_id === currentUserId &&
                        u.sender_type === currentUserType
                            ? 'Bạn'
                            : u.sender_name
                    )
                    .join(', ');

                return (
                    <button
                        key={r.emoji}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleReaction(r.emoji);
                        }}
                        title={userNames}
                        className={`group relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold shadow-2xs border transition-all active:scale-95 cursor-pointer ${
                            hasReacted
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400/40'
                                : 'bg-white/90 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                        <span className="text-xs sm:text-sm">{r.emoji}</span>
                        <span className="text-[11px] font-bold">{r.count}</span>

                        {/* Tooltip on hover */}
                        <span className="pointer-events-none absolute bottom-full mb-1.5 hidden rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white shadow-md group-hover:block whitespace-nowrap z-30">
                            {userNames}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default MessageReactionsDisplay;

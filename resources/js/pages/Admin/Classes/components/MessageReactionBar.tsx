import React from 'react';
import { Reply, Pin } from 'lucide-react';

interface Props {
    onReact: (emoji: string) => void;
    onReply?: () => void;
    onTogglePin?: () => void;
    isPinned?: boolean;
    canPin?: boolean;
    isSelf: boolean;
}

const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

export const MessageReactionBar: React.FC<Props> = ({
    onReact,
    onReply,
    onTogglePin,
    isPinned = false,
    canPin = false,
    isSelf,
}) => {
    return (
        <div
            className={`absolute -top-9.5 ${
                isSelf ? 'right-0' : 'left-0'
            } z-30 flex items-center gap-0.5 rounded-full border border-gray-200/90 bg-white/95 px-1.5 py-1 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Quick Reaction Emojis */}
            <div className="flex items-center gap-0.5">
                {QUICK_REACTION_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReact(emoji);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-sm sm:text-base transition-transform hover:scale-125 active:scale-95 hover:bg-gray-100/80 cursor-pointer"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Divider */}
            {(onReply || (canPin && onTogglePin)) && (
                <div className="mx-1 h-4 w-px bg-gray-200" />
            )}

            {/* Reply Button */}
            {onReply && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onReply();
                    }}
                    title="Trả lời tin nhắn này"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-95 cursor-pointer"
                >
                    <Reply className="h-3.5 w-3.5" />
                </button>
            )}

            {/* Pin Button */}
            {canPin && onTogglePin && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin();
                    }}
                    title={isPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-95 cursor-pointer ${
                        isPinned
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-gray-500 hover:bg-amber-50 hover:text-amber-600'
                    }`}
                >
                    <Pin
                        className={`h-3.5 w-3.5 ${
                            isPinned ? 'fill-amber-500' : ''
                        }`}
                    />
                </button>
            )}
        </div>
    );
};

export default MessageReactionBar;

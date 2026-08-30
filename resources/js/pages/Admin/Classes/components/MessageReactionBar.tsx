import React from 'react';

interface Props {
    onReact: (emoji: string) => void;
    isSelf: boolean;
}

const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

export const MessageReactionBar: React.FC<Props> = ({
    onReact,
    isSelf,
}) => {
    return (
        <div
            className={`absolute top-full mt-1.5 ${
                isSelf ? 'right-0' : 'left-0'
            } z-30 flex items-center gap-0.5 rounded-full border border-gray-200/90 bg-white/95 px-2 py-1 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none`}
            onClick={(e) => e.stopPropagation()}
        >
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
    );
};

export default MessageReactionBar;


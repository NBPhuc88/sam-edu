import { X } from 'lucide-react';
import React,{ useEffect,useRef,useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelectEmoji: (emoji: string) => void;
}

interface EmojiCategory {
    id: string;
    name: string;
    icon: string;
    emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
    {
        id: 'smileys',
        name: 'Mặt cười & Cảm xúc',
        icon: '😀',
        emojis: [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
            '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
            '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
            '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖',
            '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
            '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
            '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦',
            '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴',
        ],
    },
    {
        id: 'gestures',
        name: 'Cử chỉ & Bàn tay',
        icon: '👍',
        emojis: [
            '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘',
            '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️',
            '✋', '🖖', '🫱', '🫲', '🫸', '🫷', '👏', '🙌', '👐', '🤲',
            '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶',
            '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️',
        ],
    },
    {
        id: 'hearts',
        name: 'Trái tim & Biểu tượng',
        icon: '❤️',
        emojis: [
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
            '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
            '💟', '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💥', '💯', '💢',
            '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️',
        ],
    },
    {
        id: 'education',
        name: 'Học tập & Hoạt động',
        icon: '📚',
        emojis: [
            '📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒', '📃', '📜',
            '📝', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '🎓', '🏫', '🎒',
            '📐', '📏', '📌', '📍', '📎', '🔬', '🔭', '💡', '⏰', '⏱️',
            '📅', '📆', '🎯', '🧩', '🎨', '🎬', '🎤', '🎧', '💻', '🖥️',
        ],
    },
];

export const ChatEmojiPicker: React.FC<Props> = ({
    isOpen,
    onClose,
    onSelectEmoji,
}) => {
    const [activeTab, setActiveTab] = useState<string>('smileys');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const pickerRef = useRef<HTMLDivElement | null>(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const currentCategory =
        EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

    const displayEmojis = searchQuery.trim()
        ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
        : currentCategory.emojis;

    return (
        <div
            ref={pickerRef}
            className="absolute bottom-14 left-2 z-50 w-72 sm:w-80 rounded-2xl border border-gray-200 bg-white/98 shadow-2xl backdrop-blur-md p-3 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
            {/* Header / Tabs */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                <div className="flex items-center gap-1">
                    {EMOJI_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(cat.id);
                                setSearchQuery('');
                            }}
                            title={cat.name}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl text-base transition-all ${
                                activeTab === cat.id && !searchQuery
                                    ? 'bg-emerald-100 text-emerald-900 scale-110 shadow-xs'
                                    : 'hover:bg-gray-100 text-gray-500'
                            }`}
                        >
                            {cat.icon}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Category Title */}
            <div className="text-2xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {searchQuery ? 'Tất cả biểu tượng' : currentCategory.name}
            </div>

            {/* Emojis Grid */}
            <div className="grid grid-cols-8 gap-1 max-h-52 overflow-y-auto pr-1">
                {displayEmojis.map((emoji, idx) => (
                    <button
                        key={`${emoji}-${idx}`}
                        type="button"
                        onClick={() => {
                            onSelectEmoji(emoji);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-transform hover:scale-125 hover:bg-emerald-50 active:scale-95 cursor-pointer select-none"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ChatEmojiPicker;

"use client";
const EMOJIS = ["🔥", "⭐", "💡", "❤️", "🎉", "👀", "🚀"];
interface EmojiPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
}
export function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex gap-1 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-2xl px-3 py-2 shadow-xl">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className={`text-2xl p-1.5 rounded-xl transition-all duration-150 ${emoji === selected ? "bg-white/20 scale-110 shadow-md" : "opacity-50 hover:opacity-80 hover:bg-white/10"}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

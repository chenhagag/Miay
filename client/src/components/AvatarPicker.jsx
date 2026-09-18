const avatarOptions = [
  '🐯', '🐥', '🦁', '🐱', '🐶', '🦊', '🐰', '🐼',
  '🦄', '🐨', '🦋', '🌸', '🌟', '🎀', '💜', '🔥'
]

export default function AvatarPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {avatarOptions.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${
            value === emoji
              ? 'bg-indigo-100 ring-2 ring-indigo-500 shadow-sm scale-110'
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

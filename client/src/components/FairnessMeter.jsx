export default function FairnessMeter({ user1, user2, user1Weight = 0, user2Weight = 0 }) {
  const total = user1Weight + user2Weight
  const pct1 = total > 0 ? Math.round((user1Weight / total) * 100) : 50
  const pct2 = total > 0 ? 100 - pct1 : 50

  const diff = Math.abs(pct1 - pct2)
  let statusColor, statusText
  if (diff <= 20) {
    statusColor = 'text-green-600'
    statusText = 'מאוזן'
  } else if (diff <= 40) {
    statusColor = 'text-yellow-600'
    statusText = 'סטייה קלה'
  } else {
    statusColor = 'text-red-600'
    statusText = 'לא מאוזן'
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">מד הוגנות</h3>
        <span className={`text-sm font-semibold ${statusColor}`}>{statusText}</span>
      </div>

      {/* User 1 bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: user1?.avatarColor || '#6366f1' }}
            >
              {user1?.name?.charAt(0) || '?'}
            </div>
            <span className="text-sm text-gray-700">{user1?.name || 'משתמש 1'}</span>
          </div>
          <span className="text-sm font-medium text-gray-600">{user1Weight} ({pct1}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${pct1}%`,
              backgroundColor: user1?.avatarColor || '#6366f1'
            }}
          />
        </div>
      </div>

      {/* User 2 bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: user2?.avatarColor || '#ec4899' }}
            >
              {user2?.name?.charAt(0) || '?'}
            </div>
            <span className="text-sm text-gray-700">{user2?.name || 'משתמש 2'}</span>
          </div>
          <span className="text-sm font-medium text-gray-600">{user2Weight} ({pct2}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${pct2}%`,
              backgroundColor: user2?.avatarColor || '#ec4899'
            }}
          />
        </div>
      </div>
    </div>
  )
}

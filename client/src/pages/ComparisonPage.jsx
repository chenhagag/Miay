import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { get } from '../api/client'
import { BarChart3, Loader2, CalendarDays } from 'lucide-react'

const periodOptions = [
  { key: 'daily', label: 'יומי' },
  { key: 'weekly', label: 'שבועי' },
  { key: 'monthly', label: 'חודשי' }
]

export default function ComparisonPage() {
  const { user, partner } = useAuth()
  const [period, setPeriod] = useState('daily')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchComparison = async () => {
    setLoading(true)
    try {
      const result = await get(`/dashboard/comparison?period=${period}&date=${date}`)
      setData(result)
    } catch (err) {
      console.error('Comparison fetch error:', err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComparison()
  }, [period, date])

  const userData = data?.users?.find(u => u.id === user?.id)
  const partnerData = data?.users?.find(u => u.id === partner?.id)
  const user1Weight = userData?.totalWeight ?? 0
  const user2Weight = partnerData?.totalWeight ?? 0
  const user1Tasks = userData?.tasks ?? []
  const user2Tasks = partnerData?.tasks ?? []
  const user1Count = userData?.taskCount ?? 0
  const user2Count = partnerData?.taskCount ?? 0

  const total = user1Weight + user2Weight
  const pct1 = total > 0 ? Math.round((user1Weight / total) * 100) : 50
  const pct2 = total > 0 ? 100 - pct1 : 50
  const diff = Math.abs(pct1 - pct2)

  let balanceColor, balanceBg, balanceText
  if (diff <= 20) {
    balanceColor = 'text-green-700'
    balanceBg = 'bg-green-50 border-green-200'
    balanceText = 'מאוזן - יפה מאוד!'
  } else if (diff <= 40) {
    balanceColor = 'text-yellow-700'
    balanceBg = 'bg-yellow-50 border-yellow-200'
    balanceText = 'סטייה קלה - שווה לשים לב'
  } else {
    balanceColor = 'text-red-700'
    balanceBg = 'bg-red-50 border-red-200'
    balanceText = 'לא מאוזן - כדאי לאזן'
  }

  const user1Color = user?.avatarColor || '#6366f1'
  const user2Color = partner?.avatarColor || '#ec4899'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <BarChart3 size={26} className="text-indigo-500" />
        שוויון בנטל
      </h1>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          {periodOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === opt.key
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'bg-white/70 text-gray-500 hover:bg-white hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Balance indicator */}
          <div className={`rounded-xl px-5 py-3 border ${balanceBg}`}>
            <p className={`text-sm font-semibold ${balanceColor}`}>{balanceText}</p>
            <p className="text-xs text-gray-500 mt-1">
              הפרש: {diff}% | סה"כ משקל: {total}
            </p>
          </div>

          {/* Visual bar chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">חלוקת משקל</h3>

            {/* Combined bar */}
            <div className="w-full h-10 rounded-full overflow-hidden flex mb-4 bg-gray-100">
              <div
                className="h-full flex items-center justify-center text-white text-sm font-bold transition-all duration-500"
                style={{ width: `${pct1}%`, backgroundColor: user1Color, minWidth: total > 0 ? '30px' : '0' }}
              >
                {total > 0 && `${pct1}%`}
              </div>
              <div
                className="h-full flex items-center justify-center text-white text-sm font-bold transition-all duration-500"
                style={{ width: `${pct2}%`, backgroundColor: user2Color, minWidth: total > 0 ? '30px' : '0' }}
              >
                {total > 0 && `${pct2}%`}
              </div>
            </div>

            {/* Individual bars */}
            <div className="space-y-4">
              {/* User 1 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg bg-gray-100">
                      {user?.avatar || '😊'}
                    </div>
                    <span className="font-medium text-gray-700">{user?.name || 'משתמש 1'}</span>
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-gray-800">{user1Weight}</span>
                    <span className="text-gray-400 text-sm mr-1">({user1Count} משימות)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all duration-500"
                    style={{ width: `${pct1}%`, backgroundColor: user1Color }}
                  />
                </div>
              </div>

              {/* User 2 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg bg-gray-100">
                      {partner?.avatar || '😊'}
                    </div>
                    <span className="font-medium text-gray-700">{partner?.name || 'משתמש 2'}</span>
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-gray-800">{user2Weight}</span>
                    <span className="text-gray-400 text-sm mr-1">({user2Count} משימות)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div
                    className="h-4 rounded-full transition-all duration-500"
                    style={{ width: `${pct2}%`, backgroundColor: user2Color }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Task lists side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User 1 tasks */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-base bg-gray-100">
                  {user?.avatar || '😊'}
                </div>
                <h3 className="font-semibold text-gray-800">{user?.name || 'משתמש 1'}</h3>
                <span className="text-xs text-gray-400">({user1Tasks.length})</span>
              </div>
              {user1Tasks.length === 0 ? (
                <p className="text-sm text-gray-400">אין משימות</p>
              ) : (
                <div className="space-y-2">
                  {user1Tasks.map((task, i) => (
                    <div key={task.id || i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-700">{task.title}</span>
                        {task.occurrences > 1 && (
                          <span className="text-xs text-gray-400 mr-1">×{task.occurrences}</span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-indigo-600 mr-2">{task.totalWeight || task.weight}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User 2 tasks */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-base bg-gray-100">
                  {partner?.avatar || '😊'}
                </div>
                <h3 className="font-semibold text-gray-800">{partner?.name || 'משתמש 2'}</h3>
                <span className="text-xs text-gray-400">({user2Tasks.length})</span>
              </div>
              {user2Tasks.length === 0 ? (
                <p className="text-sm text-gray-400">אין משימות</p>
              ) : (
                <div className="space-y-2">
                  {user2Tasks.map((task, i) => (
                    <div key={task.id || i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-700">{task.title}</span>
                        {task.occurrences > 1 && (
                          <span className="text-xs text-gray-400 mr-1">×{task.occurrences}</span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-pink-600 mr-2">{task.totalWeight || task.weight}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

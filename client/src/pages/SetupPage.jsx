import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Home, Users, Loader2 } from 'lucide-react'

export default function SetupPage({ onSwitch }) {
  const { setup } = useAuth()
  const [form, setForm] = useState({
    householdName: '',
    childrenCount: 0,
    user1Name: '',
    user1Email: '',
    user1Password: '',
    user2Name: '',
    user2Email: '',
    user2Password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.householdName || !form.user1Name || !form.user1Email || !form.user1Password || !form.user2Name || !form.user2Email || !form.user2Password) {
      setError('נא למלא את כל השדות')
      return
    }

    setLoading(true)
    try {
      await setup({
        householdName: form.householdName,
        childrenCount: Number(form.childrenCount),
        user1: { name: form.user1Name, email: form.user1Email, password: form.user1Password },
        user2: { name: form.user2Name, email: form.user2Email, password: form.user2Password }
      })
    } catch (err) {
      setError(err.message || 'שגיאה בהגדרת המשק')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm bg-white/80'

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
            <Home size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Miay</h1>
          <p className="text-gray-500 mt-1">ניהול משימות הבית בצורה הוגנת</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users size={22} className="text-indigo-500" />
            הגדרת משק בית חדש
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Household */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-600 border-b border-gray-100 pb-2">פרטי משק הבית</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם משק הבית</label>
                <input
                  type="text"
                  value={form.householdName}
                  onChange={(e) => handleChange('householdName', e.target.value)}
                  className={inputClass}
                  placeholder="למשל: משפחת כהן"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מספר ילדים</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={form.childrenCount}
                  onChange={(e) => handleChange('childrenCount', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* User 1 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-600 border-b border-gray-100 pb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold ml-2">1</span>
                שותף/ה ראשון/ה
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
                <input
                  type="text"
                  value={form.user1Name}
                  onChange={(e) => handleChange('user1Name', e.target.value)}
                  className={inputClass}
                  placeholder="שם מלא"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                <input
                  type="email"
                  value={form.user1Email}
                  onChange={(e) => handleChange('user1Email', e.target.value)}
                  className={inputClass}
                  placeholder="email@example.com"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
                <input
                  type="password"
                  value={form.user1Password}
                  onChange={(e) => handleChange('user1Password', e.target.value)}
                  className={inputClass}
                  placeholder="לפחות 6 תווים"
                />
              </div>
            </div>

            {/* User 2 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-600 border-b border-gray-100 pb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-bold ml-2">2</span>
                שותף/ה שני/ה
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
                <input
                  type="text"
                  value={form.user2Name}
                  onChange={(e) => handleChange('user2Name', e.target.value)}
                  className={inputClass}
                  placeholder="שם מלא"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                <input
                  type="email"
                  value={form.user2Email}
                  onChange={(e) => handleChange('user2Email', e.target.value)}
                  className={inputClass}
                  placeholder="email@example.com"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
                <input
                  type="password"
                  value={form.user2Password}
                  onChange={(e) => handleChange('user2Password', e.target.value)}
                  className={inputClass}
                  placeholder="לפחות 6 תווים"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  מגדיר...
                </>
              ) : (
                'התחלת שימוש'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            כבר יש לכם חשבון?{' '}
            <button onClick={onSwitch} className="text-indigo-600 hover:text-indigo-700 font-medium">
              התחברות
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { put } from '../api/client'
import { Loader2, Save } from 'lucide-react'
import AvatarPicker from '../components/AvatarPicker'

export default function ProfilePage() {
  const { user, fetchMe } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [avatar, setAvatar] = useState(user?.avatar || '😊')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('נא להזין שם')
      return
    }
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      await put('/auth/profile', { name: name.trim(), avatar })
      if (fetchMe) await fetchMe()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">פרופיל</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Current avatar preview */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl shadow-md">
            {avatar}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm rounded-lg px-4 py-2">
              הפרופיל עודכן בהצלחה
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
              placeholder="השם שלך"
            />
          </div>

          {/* Avatar picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">אווטאר</label>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save size={18} />
                שמירה
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

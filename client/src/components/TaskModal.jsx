import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const categories = ['ניקיון', 'בישול', 'כביסה', 'קניות', 'ילדים', 'תחזוקה', 'אחר']
const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

const emptyTask = {
  title: '',
  description: '',
  assigneeId: '',
  type: 'RECURRING',
  recurrence: 'DAILY',
  recurrenceDays: [],
  scheduledDate: '',
  timeSpecific: false,
  startTime: '',
  endTime: '',
  weight: 3,
  category: 'אחר'
}

export default function TaskModal({ task, onSave, onDelete, onClose }) {
  const { user, partner } = useAuth()
  const [form, setForm] = useState(emptyTask)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!task?._id

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        assigneeId: task.assigneeId || task.assignee?._id || '',
        type: task.type || 'RECURRING',
        recurrence: task.recurrence || 'DAILY',
        recurrenceDays: task.recurrenceDays || [],
        scheduledDate: task.scheduledDate ? task.scheduledDate.split('T')[0] : '',
        timeSpecific: task.timeSpecific || false,
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        weight: task.weight || 3,
        category: task.category || 'אחר'
      })
    } else {
      setForm(emptyTask)
    }
  }, [task])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleDay = (dayIndex) => {
    setForm((prev) => {
      const days = prev.recurrenceDays.includes(dayIndex)
        ? prev.recurrenceDays.filter((d) => d !== dayIndex)
        : [...prev.recurrenceDays, dayIndex]
      return { ...prev, recurrenceDays: days }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('נא להזין כותרת למשימה')
      return
    }
    setError('')
    setSaving(true)
    try {
      const payload = { ...form }
      if (payload.type !== 'RECURRING') {
        delete payload.recurrence
        delete payload.recurrenceDays
      }
      if (payload.type !== 'ONE_TIME') {
        delete payload.scheduledDate
      }
      if (!payload.timeSpecific) {
        delete payload.startTime
        delete payload.endTime
      }
      if (!payload.assigneeId) {
        delete payload.assigneeId
      }
      await onSave(payload, task?._id)
      onClose()
    } catch (err) {
      setError(err.message || 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('למחוק את המשימה?')) return
    setSaving(true)
    try {
      await onDelete(task._id)
      onClose()
    } catch (err) {
      setError(err.message || 'שגיאה במחיקה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isEditing ? 'עריכת משימה' : 'משימה חדשה'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
              placeholder="שם המשימה..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm resize-none"
              placeholder="תיאור (אופציונלי)..."
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שיוך</label>
            <select
              value={form.assigneeId}
              onChange={(e) => handleChange('assigneeId', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm bg-white"
            >
              <option value="">ללא שיוך</option>
              {user && <option value={user._id}>{user.name} (אני)</option>}
              {partner && <option value={partner._id}>{partner.name}</option>}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
            <select
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
            <div className="flex gap-2">
              {[
                { value: 'RECURRING', label: 'חוזרת' },
                { value: 'ONE_TIME', label: 'חד פעמית' },
                { value: 'UNSCHEDULED', label: 'לא מתוזמנת' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange('type', opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    form.type === opt.value
                      ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence (if recurring) */}
          {form.type === 'RECURRING' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תדירות</label>
              <div className="flex gap-2">
                {[
                  { value: 'DAILY', label: 'יומי' },
                  { value: 'WEEKLY', label: 'שבועי' },
                  { value: 'MONTHLY', label: 'חודשי' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('recurrence', opt.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      form.recurrence === opt.value
                        ? 'bg-purple-100 text-purple-700 shadow-sm'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Weekly day picker */}
              {form.recurrence === 'WEEKLY' && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {dayNames.map((name, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`w-10 h-10 rounded-full text-xs font-medium transition-all ${
                        form.recurrenceDays.includes(i)
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {name.charAt(0)}'{name.charAt(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scheduled date (if one-time) */}
          {form.type === 'ONE_TIME' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
              />
            </div>
          )}

          {/* Time specific */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.timeSpecific}
                onChange={(e) => handleChange('timeSpecific', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-400"
              />
              <span className="text-sm font-medium text-gray-700">משימה בשעה ספציפית</span>
            </label>

            {form.timeSpecific && (
              <div className="flex gap-3 mt-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">שעת התחלה</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">שעת סיום</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              משקל: <span className="text-indigo-600 font-bold">{form.weight}</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.weight}
              onChange={(e) => handleChange('weight', Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>קל</span>
              <span>כבד</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'שומר...' : isEditing ? 'עדכון' : 'יצירה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl font-medium transition-colors"
            >
              ביטול
            </button>
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors disabled:opacity-50"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

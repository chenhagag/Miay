import { useState } from 'react'
import { Sparkles, X, Send, Loader2, Check } from 'lucide-react'
import { post } from '../api/client'

export default function AiChatPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setError('')
    setResult(null)
    setConfirmed(false)
    try {
      const data = await post('/ai/parse-task', { message: input })
      setResult(data)
    } catch (err) {
      setError(err.message || 'שגיאה בעיבוד הבקשה')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    // Task was already created by the AI endpoint on the server
    setConfirmed(true)
    setInput('')
    setTimeout(() => {
      setResult(null)
      setConfirmed(false)
    }, 2000)
  }

  const handleCancel = () => {
    setResult(null)
    setError('')
    setConfirmed(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const typeLabels = {
    RECURRING: 'חוזרת',
    ONE_TIME: 'חד פעמית',
    UNSCHEDULED: 'לא מתוזמנת'
  }

  const recurrenceLabels = {
    DAILY: 'יומי',
    WEEKLY: 'שבועי',
    MONTHLY: 'חודשי'
  }

  const taskData = result?.task || result

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 md:bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 rotate-45'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 animate-pulse hover:animate-none'
        }`}
      >
        {isOpen ? (
          <X size={24} className="text-white -rotate-45" />
        ) : (
          <Sparkles size={24} className="text-white" />
        )}
      </button>

      {/* Panel */}
      <div
        className={`fixed bottom-36 md:bottom-24 left-6 z-50 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 origin-bottom-left ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-75 opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-indigo-500 to-purple-600 rounded-t-2xl px-5 py-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Sparkles size={18} />
            עוזרת AI
          </h3>
          <p className="text-indigo-100 text-xs mt-1">
            ספרו לי על המשימה ואני אעזור להוסיף אותה
          </p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Confirmed message */}
          {confirmed && (
            <div className="bg-green-50 text-green-600 text-sm rounded-lg px-3 py-2 flex items-center gap-2">
              <Check size={16} />
              המשימה נוצרה בהצלחה!
            </div>
          )}

          {/* AI result */}
          {taskData && !confirmed && (
            <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-800">המשימה שזוהתה:</p>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">כותרת:</span> {taskData.title}</p>
                {taskData.category && (
                  <p><span className="font-medium">קטגוריה:</span> {taskData.category}</p>
                )}
                {taskData.type && (
                  <p><span className="font-medium">סוג:</span> {typeLabels[taskData.type] || taskData.type}</p>
                )}
                {taskData.recurrence && (
                  <p><span className="font-medium">תדירות:</span> {recurrenceLabels[taskData.recurrence] || taskData.recurrence}</p>
                )}
                {taskData.weight && (
                  <p><span className="font-medium">משקל:</span> {taskData.weight}</p>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'יוצר...' : 'אישור ויצירה'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && !result && (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={24} className="text-indigo-500 animate-spin" />
              <span className="text-sm text-gray-500 mr-2">מעבד...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="הוסיפי משימה להשקות עציצים פעם בשבוע..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
              dir="rtl"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

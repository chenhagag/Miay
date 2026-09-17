import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { get, put } from '../api/client'
import { Loader2, UserPlus, CalendarDays, AlertCircle } from 'lucide-react'

export default function UnassignedPage() {
  const { user, partner } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [scheduleTaskId, setScheduleTaskId] = useState(null)
  const [scheduleForm, setScheduleForm] = useState({ type: 'ONE_TIME', scheduledDate: '', recurrence: 'DAILY' })

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const data = await get('/tasks?assignee=unassigned')
      setTasks(Array.isArray(data) ? data : data.tasks || [])
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleAssign = async (taskId, assigneeId) => {
    try {
      await put(`/tasks/${taskId}`, { assigneeId })
      fetchTasks()
    } catch (err) {
      console.error('Assign error:', err)
    }
  }

  const handleScheduleSave = async (taskId) => {
    try {
      const payload = { type: scheduleForm.type }
      if (scheduleForm.type === 'ONE_TIME') {
        payload.scheduledDate = scheduleForm.scheduledDate
      } else if (scheduleForm.type === 'RECURRING') {
        payload.recurrence = scheduleForm.recurrence
      }
      await put(`/tasks/${taskId}`, payload)
      setScheduleTaskId(null)
      fetchTasks()
    } catch (err) {
      console.error('Schedule error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertCircle size={26} className="text-amber-500" />
        <h1 className="text-2xl font-bold text-gray-800">משימות ללא שיוך</h1>
        <span className="bg-amber-100 text-amber-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white/80 rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">כל המשימות משויכות - מצוין!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{task.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {task.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      משקל: {task.weight || 1}
                    </span>
                    {task.description && (
                      <span className="text-xs text-gray-400">{task.description}</span>
                    )}
                  </div>
                </div>

                {/* Weight dots */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < (task.weight || 1) ? 'bg-indigo-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Quick assign buttons */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-xs text-gray-500 ml-1">שיוך מהיר:</span>
                <button
                  onClick={() => handleAssign(task.id, user.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <UserPlus size={14} />
                  שיוך אליי
                </button>
                {partner && (
                  <button
                    onClick={() => handleAssign(task.id, partner.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <UserPlus size={14} />
                    שיוך ל{partner.name}
                  </button>
                )}
                <button
                  onClick={() => setScheduleTaskId(scheduleTaskId === task.id ? null : task.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                >
                  <CalendarDays size={14} />
                  תזמון
                </button>
              </div>

              {/* Schedule form */}
              {scheduleTaskId === task.id && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex gap-2">
                    {['ONE_TIME', 'RECURRING'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setScheduleForm((prev) => ({ ...prev, type: t }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          scheduleForm.type === t
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-white text-gray-500'
                        }`}
                      >
                        {t === 'ONE_TIME' ? 'חד פעמית' : 'חוזרת'}
                      </button>
                    ))}
                  </div>

                  {scheduleForm.type === 'ONE_TIME' && (
                    <input
                      type="date"
                      value={scheduleForm.scheduledDate}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-indigo-400"
                    />
                  )}

                  {scheduleForm.type === 'RECURRING' && (
                    <select
                      value={scheduleForm.recurrence}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, recurrence: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-indigo-400"
                    >
                      <option value="DAILY">יומי</option>
                      <option value="WEEKLY">שבועי</option>
                      <option value="MONTHLY">חודשי</option>
                    </select>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleScheduleSave(task.id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      שמירה
                    </button>
                    <button
                      onClick={() => setScheduleTaskId(null)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-600 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { get, put } from '../api/client'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import FairnessMeter from '../components/FairnessMeter'
import { Sun, AlertCircle, Plus, Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { user, partner } = useAuth()
  const [tasks, setTasks] = useState([])
  const [comparison, setComparison] = useState(null)
  const [unassignedCount, setUnassignedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editTask, setEditTask] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const todayHebrew = new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const [tasksData, compData, unassignedData] = await Promise.all([
        get(`/tasks?view=daily&date=${today}&assignee=${user._id}`),
        get('/dashboard/comparison?period=daily').catch(() => null),
        get('/tasks?assignee=unassigned').catch(() => [])
      ])
      setTasks(Array.isArray(tasksData) ? tasksData : tasksData.tasks || [])
      setComparison(compData)
      setUnassignedCount(Array.isArray(unassignedData) ? unassignedData.length : unassignedData?.tasks?.length || 0)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const handleComplete = async (task) => {
    try {
      await put(`/tasks/${task._id}`, { completed: !task.completed })
      fetchData()
    } catch (err) {
      console.error('Complete error:', err)
    }
  }

  const handleSave = async (payload, id) => {
    const { post: apiPost } = await import('../api/client')
    if (id) {
      await put(`/tasks/${id}`, payload)
    } else {
      await apiPost('/tasks', payload)
    }
    fetchData()
  }

  const handleDelete = async (id) => {
    const { del } = await import('../api/client')
    await del(`/tasks/${id}`)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="bg-gradient-to-l from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Sun size={28} />
          <h1 className="text-2xl font-bold">שלום, {user?.name}!</h1>
        </div>
        <p className="text-indigo-100">{todayHebrew}</p>
      </div>

      {/* Unassigned badge */}
      {unassignedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            יש <span className="font-bold">{unassignedCount}</span> משימות ללא שיוך
          </p>
        </div>
      )}

      {/* Fairness meter */}
      {comparison && (
        <FairnessMeter
          user1={user}
          user2={partner}
          user1Weight={comparison.user1Weight ?? comparison.userWeight ?? 0}
          user2Weight={comparison.user2Weight ?? comparison.partnerWeight ?? 0}
        />
      )}

      {/* Today's tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">משימות להיום</h2>
          <button
            onClick={() => { setEditTask(null); setShowModal(true) }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            משימה חדשה
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-gray-500">אין משימות להיום</p>
            <p className="text-gray-400 text-sm mt-1">אפשר להוסיף משימה חדשה או להשתמש בעוזרת AI</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onComplete={handleComplete}
                onEdit={(t) => { setEditTask(t); setShowModal(true) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => { setShowModal(false); setEditTask(null) }}
        />
      )}
    </div>
  )
}

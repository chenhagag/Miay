import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { get, put, post, del } from '../api/client'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import { Plus, Loader2, Filter, Users } from 'lucide-react'

const assigneeFilters = [
  { key: 'all', label: 'הכל' },
  { key: 'me', label: 'שלי' },
  { key: 'partner', label: 'שותף/ה' },
  { key: 'unassigned', label: 'ללא שיוך' }
]

const typeFilters = [
  { key: 'all', label: 'כל הסוגים' },
  { key: 'RECURRING', label: 'חוזרות' },
  { key: 'ONE_TIME', label: 'חד פעמיות' },
  { key: 'UNSCHEDULED', label: 'לא מתוזמנות' }
]

const categories = [
  { value: 'all', label: 'הכל' },
  { value: 'dishes', label: 'כלים' },
  { value: 'laundry', label: 'כביסה' },
  { value: 'cleaning', label: 'ניקיון' },
  { value: 'cooking', label: 'בישול' },
  { value: 'kids', label: 'ילדים' },
  { value: 'errands', label: 'סידורים' },
  { value: 'garden', label: 'גינה' },
  { value: 'general', label: 'כללי' }
]

const categoryLabelMap = Object.fromEntries(categories.map((c) => [c.value, c.label]))

export default function AllTasksPage() {
  const { user, partner } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editTask, setEditTask] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const data = await get('/tasks')
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

  const filteredTasks = useMemo(() => {
    let result = tasks

    // Assignee filter
    if (assigneeFilter === 'me') {
      result = result.filter((t) => t.assigneeId === user?.id || t.assignee?.id === user?.id)
    } else if (assigneeFilter === 'partner') {
      result = result.filter((t) => t.assigneeId === partner?.id || t.assignee?.id === partner?.id)
    } else if (assigneeFilter === 'unassigned') {
      result = result.filter((t) => !t.assigneeId && !t.assignee)
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter)
    }

    return result
  }, [tasks, assigneeFilter, typeFilter, categoryFilter, user, partner])

  const groupedTasks = useMemo(() => {
    const groups = {}
    filteredTasks.forEach((task) => {
      const cat = categoryLabelMap[task.category] || categoryLabelMap['general']
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(task)
    })
    return groups
  }, [filteredTasks])

  const handleComplete = async (task) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const isCompletedToday = task.type === 'RECURRING'
        ? (task.completions || []).some(c => c.completedDate?.startsWith(today))
        : !!task.isCompleted
      const endpoint = isCompletedToday ? 'uncomplete' : 'complete'
      await post(`/tasks/${task.id}/${endpoint}`)
      fetchTasks()
    } catch (err) {
      console.error('Complete error:', err)
    }
  }

  const handleSave = async (payload, id) => {
    if (id) {
      await put(`/tasks/${id}`, payload)
    } else {
      await post('/tasks', payload)
    }
    fetchTasks()
  }

  const handleDelete = async (id) => {
    await del(`/tasks/${id}`)
    fetchTasks()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users size={26} className="text-indigo-500" />
          כל המשימות
        </h1>
        <button
          onClick={() => { setEditTask(null); setShowModal(true) }}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          משימה חדשה
        </button>
      </div>

      {/* Assignee filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {assigneeFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setAssigneeFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              assigneeFilter === f.key
                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                : 'bg-white/70 text-gray-500 hover:bg-white hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Type + Category filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:border-indigo-400 outline-none"
          >
            {typeFilters.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:border-indigo-400 outline-none"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400">{filteredTasks.length} משימות</span>
      </div>

      {/* Tasks */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
      ) : Object.keys(groupedTasks).length === 0 ? (
        <div className="bg-white/80 rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">אין משימות להצגה</p>
        </div>
      ) : (
        Object.entries(groupedTasks).map(([category, catTasks]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-600 mb-3 pr-1">{category}</h3>
            <div className="space-y-2">
              {catTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onEdit={(t) => { setEditTask(t); setShowModal(true) }}
                />
              ))}
            </div>
          </div>
        ))
      )}

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

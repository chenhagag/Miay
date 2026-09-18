import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { get, put, post, del } from '../api/client'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import { Plus, Loader2, Filter, ChevronRight, ChevronLeft, CalendarDays, Settings2 } from 'lucide-react'

const viewModes = [
  { key: 'current', label: 'תצוגה נוכחית', icon: CalendarDays },
  { key: 'manage', label: 'ניהול משימות', icon: Settings2 }
]

const timePeriods = [
  { key: 'daily', label: 'יומי' },
  { key: 'weekly', label: 'שבועי' },
  { key: 'monthly', label: 'חודשי' }
]

const typeFilters = [
  { key: 'all', label: 'הכל' },
  { key: 'DAILY', label: 'יומי' },
  { key: 'WEEKLY', label: 'שבועי' },
  { key: 'MONTHLY', label: 'חודשי' },
  { key: 'ONE_TIME', label: 'חד פעמי' },
  { key: 'UNSCHEDULED', label: 'לא מתוזמן' }
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

export default function MyTasksPage() {
  const { user } = useAuth()
  const [allTasks, setAllTasks] = useState([])
  const [currentTasks, setCurrentTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('current')
  const [timePeriod, setTimePeriod] = useState('daily')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editTask, setEditTask] = useState(null)
  const [showModal, setShowModal] = useState(false)

  // Fetch all tasks (for manage view)
  const fetchAllTasks = async () => {
    try {
      const data = await get(`/tasks?assignee=${user.id}`)
      setAllTasks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }

  // Fetch tasks for current period
  const fetchCurrentTasks = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const data = await get(`/tasks?view=${timePeriod}&date=${dateStr}&assignee=${user.id}`)
      setCurrentTasks(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch current tasks error:', err)
    }
  }

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([fetchAllTasks(), fetchCurrentTasks()])
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (user && viewMode === 'current') fetchCurrentTasks()
  }, [selectedDate, timePeriod])

  const changeDay = (delta) => {
    setSelectedDate(prev => {
      const d = new Date(prev)
      if (timePeriod === 'daily') d.setDate(d.getDate() + delta)
      else if (timePeriod === 'weekly') d.setDate(d.getDate() + delta * 7)
      else if (timePeriod === 'monthly') d.setMonth(d.getMonth() + delta)
      return d
    })
  }

  const getDateLabel = () => {
    if (timePeriod === 'daily') {
      return selectedDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
    } else if (timePeriod === 'weekly') {
      const start = new Date(selectedDate)
      start.setDate(start.getDate() - start.getDay())
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}`
    } else {
      return selectedDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    }
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  // Filter tasks based on view mode
  const filteredTasks = useMemo(() => {
    let result = viewMode === 'current' ? currentTasks : allTasks

    // In manage mode, apply type filter
    if (viewMode === 'manage' && typeFilter !== 'all') {
      if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(typeFilter)) {
        result = result.filter((t) => t.type === 'RECURRING' && t.recurrence === typeFilter)
      } else {
        result = result.filter((t) => t.type === typeFilter)
      }
    }

    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter)
    }
    // Sort: uncompleted first, completed at bottom
    const today = new Date().toISOString().split('T')[0]
    result = [...result].sort((a, b) => {
      const aDone = a.type === 'RECURRING'
        ? (a.completions || []).some(c => c.completedDate?.startsWith(today))
        : !!a.isCompleted
      const bDone = b.type === 'RECURRING'
        ? (b.completions || []).some(c => c.completedDate?.startsWith(today))
        : !!b.isCompleted
      if (aDone !== bDone) return aDone ? 1 : -1
      return 0
    })
    return result
  }, [allTasks, currentTasks, viewMode, typeFilter, categoryFilter])

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
      fetchAllTasks()
      fetchCurrentTasks()
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
    fetchAllTasks()
    fetchCurrentTasks()
  }

  const handleDelete = async (id) => {
    await del(`/tasks/${id}`)
    fetchAllTasks()
    fetchCurrentTasks()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">המשימות שלי</h1>
        <button
          onClick={() => { setEditTask(null); setShowModal(true) }}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          משימה חדשה
        </button>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-2">
        {viewModes.map((mode) => {
          const Icon = mode.icon
          return (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                viewMode === mode.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white/70 text-gray-500 hover:bg-white hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {mode.label}
            </button>
          )
        })}
      </div>

      {/* Current view: period tabs + date navigator */}
      {viewMode === 'current' && (
        <>
          <div className="flex gap-2">
            {timePeriods.map((p) => (
              <button
                key={p.key}
                onClick={() => setTimePeriod(p.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  timePeriod === p.key
                    ? 'bg-purple-100 text-purple-700 shadow-sm'
                    : 'bg-white/70 text-gray-500 hover:bg-white hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <button onClick={() => changeDay(1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ChevronRight size={20} className="text-gray-600" />
              </button>
              <div className="text-center">
                <p className="font-semibold text-gray-800">{getDateLabel()}</p>
                {timePeriod === 'daily' && !isToday && (
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="text-xs text-indigo-600 hover:text-indigo-700 mt-1"
                  >
                    חזרה להיום
                  </button>
                )}
                {timePeriod === 'daily' && isToday && <p className="text-xs text-indigo-500">היום</p>}
              </div>
              <button onClick={() => changeDay(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Manage view: type filters */}
      {viewMode === 'manage' && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {typeFilters.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                typeFilter === tab.key
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'bg-white/70 text-gray-500 hover:bg-white hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Category filter */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400">{filteredTasks.length} משימות</span>
      </div>

      {/* Tasks grouped by category */}
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

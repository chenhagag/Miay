import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { get, put, post, del } from '../api/client'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import { Plus, Loader2, Filter } from 'lucide-react'

const filterTabs = [
  { key: 'all', label: 'הכל' },
  { key: 'DAILY', label: 'יומי' },
  { key: 'WEEKLY', label: 'שבועי' },
  { key: 'MONTHLY', label: 'חודשי' },
  { key: 'ONE_TIME', label: 'חד פעמי' },
  { key: 'UNSCHEDULED', label: 'לא מתוזמן' }
]

const categories = ['הכל', 'ניקיון', 'בישול', 'כביסה', 'קניות', 'ילדים', 'תחזוקה', 'אחר']

export default function MyTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('הכל')
  const [editTask, setEditTask] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const data = await get(`/tasks?assignee=${user.id}`)
      setTasks(Array.isArray(data) ? data : data.tasks || [])
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchTasks()
  }, [user])

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (activeTab !== 'all') {
      if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(activeTab)) {
        result = result.filter((t) => t.type === 'RECURRING' && t.recurrence === activeTab)
      } else {
        result = result.filter((t) => t.type === activeTab)
      }
    }
    if (categoryFilter !== 'הכל') {
      result = result.filter((t) => t.category === categoryFilter)
    }
    return result
  }, [tasks, activeTab, categoryFilter])

  const groupedTasks = useMemo(() => {
    const groups = {}
    filteredTasks.forEach((task) => {
      const cat = task.category || 'אחר'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(task)
    })
    return groups
  }, [filteredTasks])

  const handleComplete = async (task) => {
    try {
      await put(`/tasks/${task.id}`, { completed: !task.completed })
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
        <h1 className="text-2xl font-bold text-gray-800">המשימות שלי</h1>
        <button
          onClick={() => { setEditTask(null); setShowModal(true) }}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          משימה חדשה
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                : 'bg-white/70 text-gray-500 hover:bg-white hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
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

import { CheckCircle2, Circle, Clock, CalendarDays, Pencil } from 'lucide-react'

const categoryColors = {
  'ניקיון': 'bg-blue-100 text-blue-700',
  'בישול': 'bg-orange-100 text-orange-700',
  'כביסה': 'bg-purple-100 text-purple-700',
  'קניות': 'bg-green-100 text-green-700',
  'ילדים': 'bg-pink-100 text-pink-700',
  'תחזוקה': 'bg-yellow-100 text-yellow-700',
  'אחר': 'bg-gray-100 text-gray-700'
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

export default function TaskCard({ task, onComplete, onEdit, readOnly = false }) {
  const isOneTimeWithDate = task.type === 'ONE_TIME' && task.scheduledDate
  const colorClass = categoryColors[task.category] || categoryColors['אחר']

  const handleComplete = (e) => {
    e.stopPropagation()
    if (onComplete && !readOnly) onComplete(task)
  }

  const handleClick = () => {
    if (onEdit && !readOnly) onEdit(task)
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 ${
        !readOnly ? 'cursor-pointer' : ''
      } ${
        isOneTimeWithDate ? 'border-r-4 border-orange-400' : 'border border-gray-100'
      } ${
        task.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox */}
        {!readOnly && (
          <button
            onClick={handleComplete}
            className="mt-0.5 flex-shrink-0 transition-colors"
          >
            {task.completed ? (
              <CheckCircle2 size={22} className="text-green-500" />
            ) : (
              <Circle size={22} className="text-gray-300 hover:text-indigo-400" />
            )}
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className={`font-medium text-gray-800 ${
                task.completed ? 'line-through text-gray-400' : ''
              }`}
            >
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-2">
            {/* Category badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
              {task.category || 'אחר'}
            </span>

            {/* Type badge */}
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {typeLabels[task.type] || task.type}
            </span>

            {/* Recurrence */}
            {task.recurrence && (
              <span className="text-xs text-gray-500">
                {recurrenceLabels[task.recurrence]}
              </span>
            )}

            {/* Time */}
            {task.timeSpecific && task.startTime && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} />
                {task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}
              </span>
            )}

            {/* Scheduled date for one-time */}
            {isOneTimeWithDate && (
              <span className="text-xs text-orange-600 flex items-center gap-1">
                <CalendarDays size={12} />
                {new Date(task.scheduledDate).toLocaleDateString('he-IL')}
              </span>
            )}
          </div>
        </div>

        {/* Weight dots */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < (task.weight || 1)
                  ? 'bg-indigo-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Assignee avatar */}
        {task.assignee && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: task.assignee.avatarColor || '#6366f1' }}
            title={task.assignee.name}
          >
            {task.assignee.name?.charAt(0) || '?'}
          </div>
        )}

        {/* Edit icon */}
        {!readOnly && (
          <Pencil size={16} className="text-gray-300 flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  )
}

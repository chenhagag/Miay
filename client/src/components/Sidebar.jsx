import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  ListTodo,
  HelpCircle,
  BarChart3,
  LogOut
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'דשבורד', icon: LayoutDashboard },
  { to: '/my-tasks', label: 'המשימות שלי', icon: ClipboardList },
  { to: '/partner-tasks', label: 'partner', icon: Users, dynamic: true },
  { to: '/all-tasks', label: 'כל המשימות', icon: ListTodo },
  { to: '/unassigned', label: 'ללא שיוך', icon: HelpCircle },
  { to: '/comparison', label: 'השוואה', icon: BarChart3 }
]

export default function Sidebar({ mobile = false }) {
  const { user, partner, logout } = useAuth()

  const getLabel = (item) => {
    if (item.dynamic && partner) return `המשימות של ${partner.name}`
    if (item.dynamic) return 'המשימות של השותף/ה'
    return item.label
  }

  if (mobile) {
    return (
      <nav className="fixed bottom-0 right-0 left-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-around items-center py-2 px-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                    isActive
                      ? 'text-indigo-600 font-semibold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <Icon size={20} />
                <span className="truncate max-w-[60px]">{getLabel(item)}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    )
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-sm border-l border-gray-200 h-screen sticky top-0 shadow-sm">
      {/* User info */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
            style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
          >
            {user?.name?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.name || 'משתמש'}</p>
            <p className="text-xs text-gray-500">{user?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <Icon size={20} />
              <span>{getLabel(item)}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut size={20} />
          <span>התנתקות</span>
        </button>
      </div>
    </aside>
  )
}

import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Egg, 
  Wheat, 
  Pill, 
  FileText, 
  Settings,
  Bird
} from 'lucide-react'

function Sidebar() {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/chickens', icon: Bird, label: 'Chickens' },
    { path: '/eggs', icon: Egg, label: 'Eggs' },
    { path: '/feeds', icon: Wheat, label: 'Feeds' },
    { path: '/medicine', icon: Pill, label: 'Medicine' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden">
            <img 
              src="/poultry logo.png" 
              alt="Poultry Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">Smart Poultry</h1>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium">Phase 1 MVP Active</p>
          <p className="text-xs text-gray-500 mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

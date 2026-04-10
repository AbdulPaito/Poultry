import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bird, Egg, Wheat, User } from 'lucide-react'

function MobileNav() {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/chickens', icon: Bird, label: 'Chickens' },
    { path: '/eggs', icon: Egg, label: 'Eggs' },
    { path: '/feeds', icon: Wheat, label: 'Feeds' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 safe-area-bottom">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-primary-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileNav

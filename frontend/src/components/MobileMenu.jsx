import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Bird, 
  Egg, 
  Wheat, 
  Pill, 
  FileText, 
  Settings,
  User,
  LogOut,
  X,
  Bell,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function MobileMenu({ isOpen, onClose, user, logout }) {
  const navigate = useNavigate()

  const mainNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/chickens', icon: Bird, label: 'Chickens' },
    { path: '/eggs', icon: Egg, label: 'Eggs' },
    { path: '/feeds', icon: Wheat, label: 'Feeds' },
    { path: '/medicine', icon: Pill, label: 'Medicine' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/login')
  }

  const handleProfile = () => {
    navigate('/settings')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          />
          
          {/* Slide-in Menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 lg:hidden shadow-2xl"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
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
                  <p className="text-xs text-gray-500">Menu</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* User Profile Section */}
            <div className="p-4 bg-gradient-to-br from-primary-50 to-accent-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{user?.fullName || 'Admin User'}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email || 'admin@poultry.com'}</p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={handleProfile}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 shadow-sm"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button className="flex items-center justify-center p-2 bg-white rounded-lg text-gray-700 shadow-sm relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main Menu
              </p>
              <div className="space-y-1">
                {mainNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-primary-50 text-primary-600' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </NavLink>
                  )
                })}
              </div>
            </nav>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                Smart Poultry v1.0.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileMenu

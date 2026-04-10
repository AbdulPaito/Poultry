import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import MobileMenu from '../components/MobileMenu'

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Dashboard'
    if (path === '/chickens') return 'Chicken Management'
    if (path === '/eggs') return 'Egg Production'
    if (path === '/feeds') return 'Feed Management'
    if (path === '/medicine') return 'Medicine Management'
    if (path === '/reports') return 'Reports'
    if (path === '/settings') return 'Settings'
    return 'Smart Poultry'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Slide-in Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        logout={logout}
      />
      
      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Navbar */}
        <Navbar 
          user={user} 
          logout={logout} 
          pageTitle={getPageTitle()}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        {/* Page Content */}
        <main className="p-4 lg:p-8 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout

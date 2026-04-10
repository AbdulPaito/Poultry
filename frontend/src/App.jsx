import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import axios from 'axios'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Chickens from './pages/Chickens'
import Eggs from './pages/Eggs'
import Feeds from './pages/Feeds'
import Medicine from './pages/Medicine'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Layout from './layouts/Layout'

// Initialize axios auth header from localStorage on app load
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  console.log('App initialized with auth token')
}

// Add axios request interceptor to ensure auth header is always present
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  // Wait for auth check to complete before redirecting
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="chickens" element={<Chickens />} />
          <Route path="eggs" element={<Eggs />} />
          <Route path="feeds" element={<Feeds />} />
          <Route path="medicine" element={<Medicine />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App

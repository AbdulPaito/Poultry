import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token')
      
      // Always set axios header if token exists
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      
      if (token) {
        try {
          // Verify token with backend
          const response = await axios.get(`${API_URL}/auth/me`)
          setUser(response.data)
          setIsAuthenticated(true)
          console.log('Auth verified successfully')
        } catch (error) {
          // Only logout if token is actually invalid (401), not for network errors
          if (error.response?.status === 401) {
            console.log('Token invalid or expired, clearing auth')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            delete axios.defaults.headers.common['Authorization']
            setIsAuthenticated(false)
            setUser(null)
          } else {
            // For network errors or CORS issues on Vercel, keep the session
            console.log('Auth verification failed (network/CORS), keeping session:', error.message)
            // Ensure auth header is still set
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            setIsAuthenticated(true)
            // Restore user from localStorage
            const savedUser = localStorage.getItem('user')
            if (savedUser) {
              try {
                setUser(JSON.parse(savedUser))
              } catch (e) {
                console.log('Failed to parse saved user')
              }
            }
          }
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
      setIsLoading(false)
    }
    
    verifyAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      })
      
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(user)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData)
      
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(user)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

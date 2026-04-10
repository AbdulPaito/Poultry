import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Batch API
export const batchAPI = {
  getAll: () => api.get('/batches'),
  getById: (id) => api.get(`/batches/${id}`),
  create: (data) => api.post('/batches', data),
  update: (id, data) => api.put(`/batches/${id}`, data),
  delete: (id) => api.delete(`/batches/${id}`),
  getStats: () => api.get('/batches/stats/summary')
}

// Egg API
export const eggAPI = {
  getAll: (params) => api.get('/eggs', { params }),
  getToday: () => api.get('/eggs/today'),
  getTrends: () => api.get('/eggs/trends/daily'),
  create: (data) => api.post('/eggs', data),
  update: (id, data) => api.put(`/eggs/${id}`, data),
  delete: (id) => api.delete(`/eggs/${id}`)
}

// Feed API
export const feedAPI = {
  getAll: () => api.get('/feeds'),
  getAlerts: () => api.get('/feeds/alerts/low-stock'),
  create: (data) => api.post('/feeds', data),
  update: (id, data) => api.put(`/feeds/${id}`, data),
  delete: (id) => api.delete(`/feeds/${id}`)
}

// Feed Consumption API
export const feedConsumptionAPI = {
  recordUsage: (data) => api.post('/feed-consumption', data),
  getAll: (params) => api.get('/feed-consumption', { params }),
  getTodayUsage: () => api.get('/feed-consumption/today'),
  getDailyUsage: (feedId, date) => api.get(`/feed-consumption/daily/${feedId}`, { params: { date } }),
  getSummary: (startDate, endDate) => api.get('/feed-consumption/summary/range', { params: { startDate, endDate } }),
  getById: (id) => api.get(`/feed-consumption/${id}`),
  update: (id, data) => api.put(`/feed-consumption/${id}`, data),
  delete: (id) => api.delete(`/feed-consumption/${id}`)
}

// Medicine API
export const medicineAPI = {
  getAll: () => api.get('/medicines'),
  getById: (id) => api.get(`/medicines/${id}`),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
  getAlerts: () => api.get('/medicines/alerts/all'),
  getStats: () => api.get('/medicines/stats/summary'),
  restock: (id, data) => api.post(`/medicines/${id}/restock`, data)
}

// Medicine Schedule API
export const medicineScheduleAPI = {
  getAll: (params) => api.get('/medicine-schedules', { params }),
  getToday: () => api.get('/medicine-schedules/today'),
  getPending: () => api.get('/medicine-schedules/status/pending'),
  getHistory: () => api.get('/medicine-schedules/history/completed'),
  create: (data) => api.post('/medicine-schedules', data),
  complete: (id, data) => api.post(`/medicine-schedules/${id}/complete`, data),
  cancel: (id) => api.post(`/medicine-schedules/${id}/cancel`),
  update: (id, data) => api.put(`/medicine-schedules/${id}`, data),
  delete: (id) => api.delete(`/medicine-schedules/${id}`)
}

// Reports API
export const reportAPI = {
  getEggProduction: (params) => api.get('/reports/egg-production', { params }),
  getMortality: () => api.get('/reports/mortality'),
  getFeedCosts: (params) => api.get('/reports/feed-costs', { params }),
  getMedicineCosts: (params) => api.get('/reports/medicine-costs', { params }),
  getFinancialSummary: (params) => api.get('/reports/financial-summary', { params }),
  getEggPrices: () => api.get('/reports/egg-prices'),
  updateEggPrices: (data) => api.put('/reports/egg-prices', data)
}

export default api

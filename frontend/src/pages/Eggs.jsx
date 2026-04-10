import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Calendar,
  Egg,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers,
  DollarSign
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { eggAPI, batchAPI, reportAPI } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks } from 'date-fns'

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Egg Price Modal Component
function EggPriceModal({ isOpen, onClose, eggPrices, onUpdate }) {
  const [prices, setPrices] = useState({
    small: 150,
    medium: 180,
    large: 210,
    xl: 240,
    jumbo: 270
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (eggPrices) {
      setPrices({
        small: eggPrices.small || 150,
        medium: eggPrices.medium || 180,
        large: eggPrices.large || 210,
        xl: eggPrices.xl || 240,
        jumbo: eggPrices.jumbo || 270
      })
    }
  }, [eggPrices, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await reportAPI.updateEggPrices(prices)
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating egg prices:', error)
      alert('Failed to update egg prices')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Update Egg Prices</h3>
            <p className="text-sm text-gray-500">Set prices per tray (30 eggs)</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {[
            { key: 'small', label: 'Small Eggs', color: 'bg-blue-100 text-blue-600' },
            { key: 'medium', label: 'Medium Eggs', color: 'bg-green-100 text-green-600' },
            { key: 'large', label: 'Large Eggs', color: 'bg-amber-100 text-amber-600' },
            { key: 'xl', label: 'XL Eggs', color: 'bg-orange-100 text-orange-600' },
            { key: 'jumbo', label: 'Jumbo Eggs', color: 'bg-red-100 text-red-600' }
          ].map((size) => (
            <div key={size.key} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${size.color} flex items-center justify-center font-bold`}>
                {size.key.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">{size.label}</label>
                <p className="text-xs text-gray-500">Per tray (30 eggs)</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">₱</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={prices[size.key]}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setPrices({ ...prices, [size.key]: val === '' ? 0 : parseInt(val) })
                  }}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-right font-semibold"
                />
              </div>
            </div>
          ))}
          
          <div className="bg-amber-50 p-4 rounded-xl mt-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> These prices will be used to calculate revenue in reports. 
              Loose eggs are priced at 1/30 of the tray price per piece.
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Update Prices'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function Eggs() {
  const { success, error: showError } = useToast()
  const [records, setRecords] = useState([])
  const [batches, setBatches] = useState([])
  const [eggPrices, setEggPrices] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [weeklyData, setWeeklyData] = useState([])
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = last week, 1 = next week
  const [activeBatch, setActiveBatch] = useState('all')
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false)
  
  // Delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    total: '',
    broken: '',
    small: '',
    medium: '',
    large: '',
    jumbo: '',
    notes: ''
  })

  // Validation for egg sizes
  const getSizesSum = () => {
    return (parseInt(formData.small) || 0) + 
           (parseInt(formData.medium) || 0) + 
           (parseInt(formData.large) || 0) + 
           (parseInt(formData.jumbo) || 0)
  }

  const getBrokenEggs = () => parseInt(formData.broken) || 0

  const getTotalEggs = () => parseInt(formData.total) || 0

  const getValidationStatus = () => {
    const total = getTotalEggs()
    const sizesSum = getSizesSum()
    const broken = getBrokenEggs()
    const accountedEggs = sizesSum + broken
    
    if (total === 0) return { status: 'neutral', message: '' }
    if (accountedEggs > total) return { status: 'error', message: `Total accounted (${accountedEggs}) exceeds Total Eggs (${total})` }
    if (accountedEggs < total) return { status: 'warning', message: `Sum of sizes + broken (${accountedEggs}) is less than Total Eggs (${total}). ${total - accountedEggs} eggs unaccounted for.` }
    return { status: 'success', message: 'Perfect! All eggs accounted for' }
  }

  useEffect(() => {
    // Small delay to ensure auth token is set
    const timer = setTimeout(() => {
      loadData()
      loadEggPrices()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    generateWeeklyData()
  }, [records, weekOffset])

  const loadEggPrices = async () => {
    try {
      const response = await reportAPI.getEggPrices()
      setEggPrices(response.data)
    } catch (error) {
      console.error('Error loading egg prices:', error)
    }
  }

  const loadData = async (retryCount = 0) => {
    try {
      const token = localStorage.getItem('token')
      if (!token && retryCount < 3) {
        console.log('No token found, retrying...')
        setTimeout(() => loadData(retryCount + 1), 500)
        return
      }
      
      const [recordsRes, batchesRes] = await Promise.all([
        eggAPI.getAll(),
        batchAPI.getAll()
      ])
      setRecords(recordsRes.data || [])
      setBatches(batchesRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate revenue for any egg record
  const calculateRecordRevenue = (record) => {
    if (!eggPrices) return { total: 0, small: 0, medium: 0, large: 0, xl: 0, jumbo: 0 }
    
    const perPiece = (size) => (eggPrices[size] || 0) / 30
    
    const smallRevenue = (Math.floor(record.small / 30) * (eggPrices.small || 0)) + ((record.small % 30) * perPiece('small'))
    const mediumRevenue = (Math.floor(record.medium / 30) * (eggPrices.medium || 0)) + ((record.medium % 30) * perPiece('medium'))
    const largeRevenue = (Math.floor(record.large / 30) * (eggPrices.large || 0)) + ((record.large % 30) * perPiece('large'))
    const xlRevenue = (Math.floor((record.xl || 0) / 30) * (eggPrices.xl || 0)) + (((record.xl || 0) % 30) * perPiece('xl'))
    const jumboRevenue = (Math.floor(record.jumbo / 30) * (eggPrices.jumbo || 0)) + ((record.jumbo % 30) * perPiece('jumbo'))
    
    return {
      small: smallRevenue,
      medium: mediumRevenue,
      large: largeRevenue,
      xl: xlRevenue,
      jumbo: jumboRevenue,
      total: smallRevenue + mediumRevenue + largeRevenue + xlRevenue + jumboRevenue
    }
  }

  const generateWeeklyData = () => {
    // Calculate week based on offset
    const today = new Date()
    const baseDate = addWeeks(today, weekOffset)
    const start = startOfWeek(baseDate, { weekStartsOn: 1 })
    const end = endOfWeek(baseDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })
    
    // Generate data from actual records
    const weekData = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      // Fix: Check if record.date starts with dateStr (handles both '2026-04-10' and '2026-04-10T00:00:00')
      const dayRecords = records.filter(r => {
        const recordDate = r.date.split('T')[0] // Remove time part if exists
        return recordDate === dateStr
      })
      
      const total = dayRecords.reduce((sum, r) => sum + (parseInt(r.total) || 0), 0)
      const broken = dayRecords.reduce((sum, r) => sum + (parseInt(r.broken) || 0), 0)
      
      // Calculate revenue for this day
      const dayRevenue = dayRecords.reduce((sum, r) => sum + calculateRecordRevenue(r).total, 0)
      
      return {
        day: format(day, 'EEE'),
        date: dateStr,
        fullDate: day,
        total: total,
        broken: broken,
        revenue: dayRevenue
      }
    })
    
    setWeeklyData(weekData)
  }

  // Calculate weekly total revenue (current week view)
  const weeklyTotalRevenue = weeklyData.reduce((sum, day) => sum + day.revenue, 0)
  
  // Calculate monthly revenue (last 30 days)
  const monthlyTotalRevenue = (() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    return records
      .filter(r => new Date(r.date) >= thirtyDaysAgo)
      .reduce((sum, r) => sum + calculateRecordRevenue(r).total, 0)
  })()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate egg sizes
    const validation = getValidationStatus()
    if (validation.status === 'error') {
      alert(`Cannot save: ${validation.message}`)
      return
    }
    
    try {
      // Convert empty strings to 0 before submitting
      const submitData = {
        ...formData,
        total: parseInt(formData.total) || 0,
        broken: parseInt(formData.broken) || 0,
        small: parseInt(formData.small) || 0,
        medium: parseInt(formData.medium) || 0,
        large: parseInt(formData.large) || 0,
        jumbo: parseInt(formData.jumbo) || 0,
      }
      
      if (editingRecord) {
        await eggAPI.update(editingRecord._id, submitData)
      } else {
        await eggAPI.create(submitData)
      }
      loadData()
      closeModal()
    } catch (error) {
      console.error('Error saving record:', error)
    }
  }

  const openDeleteConfirm = (id) => {
    setRecordToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false)
    setRecordToDelete(null)
  }

  const confirmDelete = async () => {
    if (!recordToDelete) return
    try {
      await eggAPI.delete(recordToDelete)
      loadData()
      closeDeleteConfirm()
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Failed to delete record: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleDelete = (id) => {
    openDeleteConfirm(id)
  }

  // Week navigation functions
  const goToPreviousWeek = () => {
    setWeekOffset(prev => prev - 1)
  }

  const goToNextWeek = () => {
    setWeekOffset(prev => prev + 1)
  }

  const goToCurrentWeek = () => {
    setWeekOffset(0)
  }

  const openAddModal = () => {
    setEditingRecord(null)
    setFormData({
      batchId: '',
      date: new Date().toISOString().split('T')[0],
      total: '',
      broken: '',
      small: '',
      medium: '',
      large: '',
      jumbo: '',
      notes: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (record) => {
    setEditingRecord(record)
    setFormData({
      batchId: record.batchId?._id || record.batchId,
      date: record.date.split('T')[0],
      total: record.total || '',
      broken: record.broken || '',
      small: record.small || '',
      medium: record.medium || '',
      large: record.large || '',
      jumbo: record.jumbo || '',
      notes: record.notes
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }

  const todayRecords = records.filter(r => r.date.split('T')[0] === selectedDate)

  const totalToday = todayRecords.reduce((sum, r) => sum + r.total, 0)

  const totalGoodEggs = todayRecords.reduce((sum, r) => sum + (r.total - (r.broken || 0)), 0)

  // Size breakdown calculations
  const totalSmall = todayRecords.reduce((sum, r) => sum + (r.small || 0), 0)
  const totalMedium = todayRecords.reduce((sum, r) => sum + (r.medium || 0), 0)
  const totalLarge = todayRecords.reduce((sum, r) => sum + (r.large || 0), 0)
  const totalJumbo = todayRecords.reduce((sum, r) => sum + (r.jumbo || 0), 0)

  // Calculate revenue based on egg prices with proper loose egg pricing
  const calculateRevenueBreakdown = (eggs, size) => {
    if (!eggPrices || eggs === 0) return { trays: 0, loose: 0, remaining: 0, revenue: 0, trayPrice: 0, piecePrice: 0 }
    
    const trayPrice = eggPrices[size] || 0
    // Calculate per-piece price as tray price divided by 30
    const piecePrice = trayPrice / 30
    
    const trays = Math.floor(eggs / 30)
    const loose = eggs % 30
    const remaining = 30 - loose // eggs needed to complete next tray
    
    const revenue = (trays * trayPrice) + (loose * piecePrice)
    
    return { trays, loose, remaining, revenue, trayPrice, piecePrice }
  }

  const smallBreakdown = calculateRevenueBreakdown(totalSmall, 'small')
  const mediumBreakdown = calculateRevenueBreakdown(totalMedium, 'medium')
  const largeBreakdown = calculateRevenueBreakdown(totalLarge, 'large')
  const xlBreakdown = calculateRevenueBreakdown(0, 'xl')
  const jumboBreakdown = calculateRevenueBreakdown(totalJumbo, 'jumbo')

  const todayRevenue = {
    small: smallBreakdown.revenue,
    medium: mediumBreakdown.revenue,
    large: largeBreakdown.revenue,
    xl: xlBreakdown.revenue,
    jumbo: jumboBreakdown.revenue,
    total: 0
  }
  todayRevenue.total = todayRevenue.small + todayRevenue.medium + todayRevenue.large + todayRevenue.xl + todayRevenue.jumbo

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Premium Header - Mobile Responsive */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-4 sm:p-5 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg"
            >
              <Egg className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Eggs</h1>
              <p className="text-white/80 text-xs sm:text-sm">Track production & revenue</p>
            </div>
          </div>
          
          {/* Right: Stats + Button */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <div className="bg-white/20 backdrop-blur rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center min-w-[55px] sm:min-w-[70px]">
              <p className="text-xl sm:text-2xl font-bold text-white">{totalToday}</p>
              <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Eggs</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center min-w-[55px] sm:min-w-[70px]">
              <p className="text-xl sm:text-2xl font-bold text-white">{Math.floor(totalToday / 30)}</p>
              <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Trays</p>
            </div>
            <div className="bg-red-500/30 backdrop-blur rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center min-w-[55px] sm:min-w-[70px]">
              <p className="text-xl sm:text-2xl font-bold text-white">{totalToday - totalGoodEggs}</p>
              <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Broken</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAddModal}
              className="bg-white text-emerald-600 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold flex items-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl transition-all whitespace-nowrap text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Record</span>
              <span className="sm:hidden">Add</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview - 3D Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Eggs - 3D */}
        <motion.div 
          whileHover={{ scale: 1.03, translateY: -2 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-100 shadow-md hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Egg className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Today's Total</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalToday || 0}</p>
              <p className="text-xs text-gray-500 mt-1">eggs collected</p>
            </div>
          </div>
        </motion.div>
        
        {/* Good Eggs - 3D */}
        <motion.div 
          whileHover={{ scale: 1.03, translateY: -2 }}
          className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-5 border border-green-100 shadow-md hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-200">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Good Eggs</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalGoodEggs || 0}</p>
              <p className="text-xs text-green-600 mt-1 font-medium">
                {totalToday > 0 ? ((totalGoodEggs/totalToday)*100).toFixed(1) : 0}% good rate
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Broken/Lost - 3D */}
        <motion.div 
          whileHover={{ scale: 1.03, translateY: -2 }}
          className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-5 border border-red-100 shadow-md hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-200">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Broken/Lost</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalToday - totalGoodEggs || 0}</p>
              <p className="text-xs text-red-500 mt-1 font-medium">
                {totalToday > 0 ? (((totalToday-totalGoodEggs)/totalToday)*100).toFixed(1) : 0}% loss rate
              </p>
            </div>
          </div>
        </motion.div>

        {/* Size Breakdown with Revenue */}
        <motion.div 
          whileHover={{ scale: 1.03, translateY: -2 }}
          className="bg-gradient-to-br from-amber-50 to-orange-100/50 rounded-2xl p-5 border border-amber-100 shadow-md hover:shadow-xl transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-200">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Today's Revenue</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">₱{Math.round(todayRevenue.total).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">based on egg prices</p>
              <button 
                onClick={() => setIsPriceModalOpen(true)}
                className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Edit Prices →
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Weekly & Monthly Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100/50 rounded-2xl p-5 border border-blue-100 shadow-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">This Week (Mon-Sun)</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">₱{Math.round(weeklyTotalRevenue).toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-600 font-medium">
              {weeklyData.filter(d => d.revenue > 0).length} days with sales
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {weekOffset === 0 ? 'Current week' : weekOffset > 0 ? `${weekOffset} week${weekOffset > 1 ? 's' : ''} ahead` : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
          </p>
        </motion.div>

        {/* Monthly Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-violet-100/50 rounded-2xl p-5 border border-purple-100 shadow-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-200">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Last 30 Days</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">₱{Math.round(monthlyTotalRevenue).toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-purple-600 font-medium">
              {records.filter(r => {
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                return new Date(r.date) >= thirtyDaysAgo
              }).length} records
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Monthly total revenue</p>
        </motion.div>
      </div>

      {/* Egg Prices Section - Colorful Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-gray-800">Egg Prices (Per Tray)</h3>
          </div>
          <button
            onClick={() => setIsPriceModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-200"
          >
            Update Prices
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {eggPrices && [
            { key: 'small', label: 'Small', count: totalSmall, breakdown: smallBreakdown, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500', lightColor: 'bg-blue-50' },
            { key: 'medium', label: 'Medium', count: totalMedium, breakdown: mediumBreakdown, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-500', lightColor: 'bg-emerald-50' },
            { key: 'large', label: 'Large', count: totalLarge, breakdown: largeBreakdown, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-500', lightColor: 'bg-amber-50' },
            { key: 'xl', label: 'XL', count: 0, breakdown: xlBreakdown, color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-500', lightColor: 'bg-orange-50' },
            { key: 'jumbo', label: 'Jumbo', count: totalJumbo, breakdown: jumboBreakdown, color: 'from-red-500 to-rose-600', bgColor: 'bg-red-500', lightColor: 'bg-red-50' }
          ].map((size) => (
            <motion.div 
              key={size.key}
              whileHover={{ scale: 1.03, y: -4 }}
              className={`bg-gradient-to-br ${size.color} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all overflow-hidden relative`}
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/90 bg-white/20 px-2 py-1 rounded-lg">
                    {size.label}
                  </span>
                  <span className="text-2xl font-bold">₱{eggPrices[size.key] || 0}</span>
                </div>
                
                {/* Price per tray */}
                <p className="text-xs text-white/80 mb-4">per tray (30 eggs)</p>
                
                {/* Divider */}
                <div className="h-px bg-white/30 mb-4" />
                
                {/* Today's Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-white/80">Today's {size.label}:</span>
                    <span className="text-lg font-bold">{size.count}</span>
                  </div>
                  <p className="text-xs text-white/60">eggs total</p>
                  
                  {/* Breakdown */}
                  {size.count > 0 && (
                    <div className={`mt-3 p-3 ${size.lightColor} rounded-xl bg-opacity-20`}>
                      <p className="text-sm font-bold text-white">
                        = ₱{Math.round(size.breakdown?.revenue || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-white/80 mt-1">
                        {size.breakdown?.trays || 0} tray{size.breakdown?.trays > 1 ? 's' : ''} × ₱{size.breakdown?.trayPrice || eggPrices[size.key]}
                      </p>
                      {size.breakdown?.loose > 0 && (
                        <p className="text-xs text-white/70">
                          + {size.breakdown.loose} loose × ₱{size.breakdown.piecePrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {size.count === 0 && (
                    <div className={`mt-3 p-3 ${size.lightColor} rounded-xl bg-opacity-20 text-center`}>
                      <p className="text-sm font-bold text-white">₱0</p>
                      <p className="text-xs text-white/70">No eggs recorded today</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Records Table - Premium Design */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Egg className="w-5 h-5 text-emerald-500" />
            Recent Records
          </h3>
          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Egg className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No records yet</p>
            <button 
              onClick={openAddModal} 
              className="text-emerald-600 font-semibold mt-2 hover:text-emerald-700 transition-colors"
            >
              Record your first batch →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="min-w-[600px] sm:min-w-full">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50/95 z-10 w-[80px] sm:w-auto">Date</th>
                    <th className="text-left px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 w-[70px] sm:w-auto">Batch</th>
                    <th className="text-center px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 w-[60px] sm:w-auto">Total</th>
                    <th className="text-center px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-red-600 w-[60px] sm:w-auto">Broken</th>
                    <th className="text-center px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-green-600 w-[60px] sm:w-auto">Good</th>
                    <th className="text-center px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-blue-600 w-[50px] sm:w-auto">S</th>
                    <th className="text-center px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-blue-600 w-[50px] sm:w-auto">M</th>
                    <th className="text-center px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-blue-600 w-[50px] sm:w-auto">L</th>
                    <th className="text-center px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-blue-600 w-[50px] sm:w-auto">XL</th>
                    <th className="text-right px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700 sticky right-0 bg-gray-50/95 z-10 w-[80px] sm:w-auto">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.slice(0, 10).map((record, idx) => (
                    <motion.tr 
                      key={record._id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-800 font-medium sticky left-0 bg-white/95 z-10 whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium">
                          {record.batchId?.batchId || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-gray-800 text-center font-bold">
                        {record.total}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-red-600 text-center font-semibold">
                        {record.broken || 0}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-green-600 text-center font-bold">
                        {record.total - (record.broken || 0)}
                      </td>
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-blue-600 text-center font-medium">
                        {record.small || 0}
                      </td>
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-blue-600 text-center font-medium">
                        {record.medium || 0}
                      </td>
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-blue-600 text-center font-medium">
                        {record.large || 0}
                      </td>
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-blue-600 text-center font-medium">
                        {record.jumbo || 0}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-right sticky right-0 bg-white/95 z-10">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(record)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 sm:p-2 rounded-lg transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record._id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 sm:p-2 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile scroll hint */}
            <div className="sm:hidden flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
              <ChevronLeft className="w-3 h-3" />
              <span>Swipe to see more</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        )}
      </motion.div>

      {/* Weekly Overview - Premium Design with Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        {/* Mobile Responsive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Title */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-gray-800">
              {weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : "History"}
            </h3>
            {/* Week Range - Mobile: below title, Desktop: inline */}
            {weeklyData.length > 0 && (
              <span className="text-xs sm:text-sm text-gray-500 font-medium sm:ml-2">
                {format(new Date(weeklyData[0].date), 'MMM d')} - {format(new Date(weeklyData[6].date), 'MMM d')}
              </span>
            )}
          </div>
          
          {/* Week Navigation - Always visible */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToPreviousWeek}
                className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600"
                title="Previous Week"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              
              {weekOffset !== 0 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goToCurrentWeek}
                  className="px-3 py-2 rounded-md hover:bg-white hover:shadow-sm transition-all text-sm font-medium text-emerald-600"
                  title="Current Week"
                >
                  Today
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToNextWeek}
                className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600"
                title="Next Week"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
            
            {/* Total eggs badge */}
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full font-medium whitespace-nowrap">
              {weeklyData.reduce((sum, d) => sum + d.total, 0)} eggs
            </span>
          </div>
        </div>
        
        {/* 7-Day Grid - Responsive */}
        <div className="grid grid-cols-7 gap-1 sm:gap-3">
          {weeklyData.map((day, idx) => (
            <motion.div 
              key={day.date}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedDate(day.date)}
              className={`relative text-center py-3 px-1 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer transition-all ${
                day.date === selectedDate 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200' 
                  : 'bg-gradient-to-br from-gray-50 to-white hover:shadow-md border border-gray-100'
              }`}
            >
              <p className={`text-[10px] sm:text-xs font-medium mb-1 sm:mb-2 ${day.date === selectedDate ? 'text-white/80' : 'text-gray-500'}`}>
                {day.day}
              </p>
              <p className={`text-base sm:text-xl font-bold mb-0.5 sm:mb-1 ${day.date === selectedDate ? 'text-white' : 'text-gray-800'}`}>
                {day.total}
              </p>
              {day.broken > 0 && (
                <p className={`text-[10px] sm:text-xs ${day.date === selectedDate ? 'text-white/70' : 'text-red-500'}`}>
                  -{day.broken}
                </p>
              )}
              {/* Mini bar chart - Hidden on mobile */}
              <div className="hidden sm:block mt-2 h-1 bg-black/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${day.date === selectedDate ? 'bg-white/50' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min((day.total / 200) * 100, 100)}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRecord ? 'Edit Record' : 'Record Egg Collection'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              required
            >
              <option value="">Select batch...</option>
              {batches.filter(b => b.status === 'active').map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchId} - {batch.breed} ({batch.quantity - (batch.mortalityCount || 0) - (batch.soldCount || 0)} chickens)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              required
            />
          </div>
          
          {/* Total and Broken Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Eggs *</label>
              <input
                type="number"
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg font-semibold"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Broken/Lost</label>
              <input
                type="number"
                value={formData.broken}
                onChange={(e) => setFormData({ ...formData, broken: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                min="0"
              />
            </div>
          </div>

          {/* Size Validation Progress Bar */}
          {(() => {
            const validation = getValidationStatus()
            const total = getTotalEggs()
            const sum = getSizesSum()
            const broken = getBrokenEggs()
            const accounted = sum + broken
            const percentage = total > 0 ? Math.min((accounted / total) * 100, 100) : 0
            
            if (total === 0) return null
            
            return (
              <div className="bg-gray-50 rounded-xl p-3 border-2 border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Total Accounted: <span className="font-bold">{accounted}</span> / {total} eggs 
                    <span className="text-xs text-gray-400">(Sizes: {sum} + Broken: {broken})</span>
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    validation.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                    validation.status === 'error' ? 'bg-red-100 text-red-700' :
                    validation.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {validation.status === 'success' ? '✓ Complete' :
                     validation.status === 'error' ? '✗ Excess' :
                     validation.status === 'warning' ? '⚠ Incomplete' :
                     'Enter sizes'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      validation.status === 'success' ? 'bg-emerald-500' :
                      validation.status === 'error' ? 'bg-red-500' :
                      validation.status === 'warning' ? 'bg-amber-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {validation.message && (
                  <p className={`text-xs mt-2 text-center font-medium ${
                    validation.status === 'success' ? 'text-emerald-600' :
                    validation.status === 'error' ? 'text-red-600' :
                    validation.status === 'warning' ? 'text-amber-600' :
                    'text-gray-500'
                  }`}>
                    {validation.message}
                  </p>
                )}
              </div>
            )
          })()}
          
          {/* Size Inputs with Color Coding */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-400"></span> Small
              </label>
              <input
                type="number"
                value={formData.small}
                onChange={(e) => setFormData({ ...formData, small: e.target.value })}
                placeholder="0"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  getTotalEggs() > 0 && (parseInt(formData.small) || 0) > 0 
                    ? 'border-blue-300 bg-blue-50/30' 
                    : 'border-gray-200'
                }`}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-400"></span> Medium
              </label>
              <input
                type="number"
                value={formData.medium}
                onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                placeholder="0"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all ${
                  getTotalEggs() > 0 && (parseInt(formData.medium) || 0) > 0 
                    ? 'border-green-300 bg-green-50/30' 
                    : 'border-gray-200'
                }`}
                min="0"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span> Large
              </label>
              <input
                type="number"
                value={formData.large}
                onChange={(e) => setFormData({ ...formData, large: e.target.value })}
                placeholder="0"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all ${
                  getTotalEggs() > 0 && (parseInt(formData.large) || 0) > 0 
                    ? 'border-amber-300 bg-amber-50/30' 
                    : 'border-gray-200'
                }`}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span> Jumbo
              </label>
              <input
                type="number"
                value={formData.jumbo}
                onChange={(e) => setFormData({ ...formData, jumbo: e.target.value })}
                placeholder="0"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all ${
                  getTotalEggs() > 0 && (parseInt(formData.jumbo) || 0) > 0 
                    ? 'border-red-300 bg-red-50/30' 
                    : 'border-gray-200'
                }`}
                min="0"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[80px] resize-none"
              placeholder="Any observations..."
            />
          </div>
          
          {/* Validation Error Banner */}
          {(() => {
            const validation = getValidationStatus()
            if (validation.status !== 'error') return null
            return (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-lg">✗</span>
                </div>
                <p className="text-sm text-red-700 font-medium">{validation.message}</p>
              </div>
            )
          })()}
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={closeModal} 
              className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                getValidationStatus().status === 'error'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-200'
              }`}
              disabled={getValidationStatus().status === 'error'}
            >
              {editingRecord ? 'Update' : 'Save'} Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Egg Price Edit Modal */}
      <EggPriceModal 
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        eggPrices={eggPrices}
        onUpdate={loadEggPrices}
      />

      {/* Beautiful Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeDeleteConfirm}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Header with warning color */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3"
                >
                  <AlertTriangle className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white">Delete Record?</h3>
                <p className="text-white/80 text-sm mt-1">This action cannot be undone</p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-6">
                  <p className="text-sm text-red-800 text-center">
                    <strong>Warning:</strong> This will permanently delete this egg production record from the database.
                  </p>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeDeleteConfirm}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(239, 68, 68, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    Delete Record
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Eggs

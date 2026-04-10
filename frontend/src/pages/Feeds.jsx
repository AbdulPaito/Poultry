import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Wheat,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Package,
  TrendingDown,
  Layers,
  DollarSign,
  ArrowUpRight,
  Filter,
  ChevronRight,
  Inbox,
  Store,
  FileText
} from 'lucide-react'
import { feedAPI, feedConsumptionAPI, batchAPI } from '../services/api'

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
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
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {title && (
          <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}
        <div className={title ? "p-5" : ""}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Feeds() {
  const [feeds, setFeeds] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFeed, setEditingFeed] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'layer',
    brand: '',
    stock: '',
    unit: 'kg',
    costPerUnit: '',
    lowStockThreshold: 10,
    supplier: '',
    notes: ''
  })

  // Delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Feed consumption tracking
  const [consumptionModalOpen, setConsumptionModalOpen] = useState(false)
  const [selectedFeed, setSelectedFeed] = useState(null)
  const [consumptionForm, setConsumptionForm] = useState({
    quantity: '',
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  // Batches for consumption form
  const [batches, setBatches] = useState([])
  
  // Today's usage stats
  const [todayUsage, setTodayUsage] = useState({ total: 0, records: [] })
  
  // Total consumption stats (all time)
  const [totalConsumption, setTotalConsumption] = useState({ 
    totalQuantity: 0, 
    totalCost: 0, 
    records: [] 
  })

  // Quick restock modal
  const [restockModalOpen, setRestockModalOpen] = useState(false)
  const [restockTarget, setRestockTarget] = useState(null)
  const [restockQuantity, setRestockQuantity] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [feedsRes, alertsRes, batchesRes, usageRes, allUsageRes] = await Promise.all([
        feedAPI.getAll(),
        feedAPI.getAlerts(),
        batchAPI.getAll(),
        feedConsumptionAPI.getTodayUsage().catch(() => ({ data: { summary: { totalQuantity: 0 } } })),
        feedConsumptionAPI.getAll().catch(() => ({ data: [] }))
      ])
      setFeeds(feedsRes.data || [])
      setAlerts(alertsRes.data || [])
      setBatches(batchesRes.data || [])
      setTodayUsage({
        total: usageRes.data?.summary?.totalQuantity || 0,
        records: usageRes.data?.records || []
      })
      
      // Calculate total consumption and cost
      const allRecords = allUsageRes.data || []
      const totalQty = allRecords.reduce((sum, r) => sum + (r.quantity || 0), 0)
      const feedsList = feedsRes.data || []
      const totalCost = allRecords.reduce((sum, r) => {
        const feed = feedsList.find(f => f._id === r.feedId)
        return sum + ((r.quantity || 0) * (feed?.costPerUnit || 0))
      }, 0)
      
      setTotalConsumption({
        totalQuantity: totalQty,
        totalCost: totalCost,
        records: allRecords
      })
    } catch (error) {
      console.error('Error loading data:', error)
      // Demo data
      setFeeds([
        {
          _id: '1',
          name: 'Premium Layer Feed',
          type: 'layer',
          brand: 'Golden Grains',
          stock: 45,
          unit: 'kg',
          costPerUnit: 28.50,
          lowStockThreshold: 10
        },
        {
          _id: '2',
          name: 'Starter Mash',
          type: 'starter',
          brand: 'Farm Fresh',
          stock: 8,
          unit: 'kg',
          costPerUnit: 32.00,
          lowStockThreshold: 15
        }
      ])
      setAlerts([feedsRes?.data?.[1]].filter(Boolean))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Convert empty strings to 0/defaults before sending
      const submitData = {
        ...formData,
        stock: formData.stock === '' ? 0 : parseFloat(formData.stock),
        costPerUnit: formData.costPerUnit === '' ? 0 : parseFloat(formData.costPerUnit),
        lowStockThreshold: formData.lowStockThreshold === '' ? 10 : parseInt(formData.lowStockThreshold)
      }
      
      if (editingFeed) {
        await feedAPI.update(editingFeed._id, submitData)
      } else {
        await feedAPI.create(submitData)
      }
      loadData()
      closeModal()
    } catch (error) {
      console.error('Error saving feed:', error)
    }
  }

  // Delete confirmation logic
  const openDeleteConfirm = (feed) => {
    setDeleteTarget(feed)
    setDeleteConfirmOpen(true)
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false)
    setDeleteTarget(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await feedAPI.delete(deleteTarget._id)
      loadData()
      closeDeleteConfirm()
    } catch (error) {
      console.error('Error deleting feed:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete feed'
      alert('Failed to delete feed: ' + errorMsg)
    }
  }

  // Consumption tracking logic
  const openConsumptionModal = (feed) => {
    setSelectedFeed(feed)
    // Pre-select first batch if available
    const firstBatch = batches.length > 0 ? batches[0]._id : ''
    setConsumptionForm({
      quantity: '',
      batchId: firstBatch,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setConsumptionModalOpen(true)
  }

  const closeConsumptionModal = () => {
    setConsumptionModalOpen(false)
    setSelectedFeed(null)
  }

  const handleConsumptionSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFeed) return

    const qty = parseFloat(consumptionForm.quantity)
    if (qty <= 0 || qty > selectedFeed.stock) {
      alert('Invalid quantity. Must be greater than 0 and not exceed current stock.')
      return
    }

    if (!consumptionForm.batchId) {
      alert('Please select a batch that consumed this feed.')
      return
    }

    try {
      // Record consumption using the new API
      await feedConsumptionAPI.recordUsage({
        feedId: selectedFeed._id,
        batchId: consumptionForm.batchId,
        quantity: qty,
        unit: selectedFeed.unit,
        date: consumptionForm.date,
        notes: consumptionForm.notes
      })
      
      loadData()
      closeConsumptionModal()
    } catch (error) {
      console.error('Error recording consumption:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to record consumption'
      alert(`Error: ${errorMsg}`)
    }
  }

  // Quick restock functions
  const openRestockModal = (feed) => {
    setRestockTarget(feed)
    setRestockQuantity('')
    setRestockModalOpen(true)
  }

  const closeRestockModal = () => {
    setRestockModalOpen(false)
    setRestockTarget(null)
    setRestockQuantity('')
  }

  const handleRestockSubmit = async (e) => {
    e.preventDefault()
    if (!restockTarget) return

    const qty = parseFloat(restockQuantity)
    if (qty <= 0) {
      alert('Please enter a valid quantity greater than 0')
      return
    }

    try {
      const newStock = restockTarget.stock + qty
      await feedAPI.update(restockTarget._id, { stock: newStock })
      loadData()
      closeRestockModal()
    } catch (error) {
      console.error('Error restocking:', error)
      alert('Failed to restock feed')
    }
  }

  const openAddModal = () => {
    setEditingFeed(null)
    setFormData({
      name: '',
      type: 'layer',
      brand: '',
      stock: '',
      unit: 'kg',
      costPerUnit: '',
      lowStockThreshold: '',
      supplier: '',
      notes: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (feed) => {
    setEditingFeed(feed)
    setFormData({
      name: feed.name,
      type: feed.type,
      brand: feed.brand || '',
      stock: feed.stock,
      unit: feed.unit,
      costPerUnit: feed.costPerUnit,
      lowStockThreshold: feed.lowStockThreshold,
      supplier: feed.supplier || '',
      notes: feed.notes || ''
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingFeed(null)
  }

  const getStockStatus = (feed) => {
    const ratio = feed.stock / feed.lowStockThreshold
    if (ratio <= 1) return { type: 'critical', label: 'Critical', color: 'red' }
    if (ratio <= 2) return { type: 'warning', label: 'Low Stock', color: 'amber' }
    return { type: 'good', label: 'In Stock', color: 'emerald' }
  }

  const getStockBadge = (feed) => {
    const status = getStockStatus(feed)
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      warning: 'bg-amber-100 text-amber-700 border-amber-200',
      good: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status.type]}`}>
        {status.label}
      </span>
    )
  }

  const getStockProgressColor = (feed) => {
    const status = getStockStatus(feed)
    const colors = {
      critical: 'bg-red-500',
      warning: 'bg-amber-500',
      good: 'bg-emerald-500'
    }
    return colors[status.type]
  }

  const filteredFeeds = feeds.filter(feed =>
    feed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feed.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalInventoryValue = feeds.reduce((sum, feed) => 
    sum + (feed.stock * feed.costPerUnit), 0
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6 pb-6"
    >
      {/* Premium Header - Mobile Optimized */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-600 via-amber-500 to-orange-500 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl sm:shadow-2xl"
      >
        {/* Mobile: Stack vertically, Desktop: Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Title Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Wheat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Feed Management</h1>
              <p className="text-white/80 text-xs sm:text-sm">Track inventory and consumption</p>
            </div>
          </div>
          
          {/* Stats & Action - Mobile: Horizontal scroll, Desktop: Row */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0">
            {/* Total Items Badge */}
            <div className="bg-white/20 backdrop-blur rounded-xl px-3 sm:px-4 py-2 text-center min-w-[60px] sm:min-w-[70px]">
              <p className="text-xl sm:text-2xl font-bold text-white">{feeds.length}</p>
              <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Items</p>
            </div>
            
            {/* Low Stock Badge */}
            <div className={`backdrop-blur rounded-xl px-3 sm:px-4 py-2 text-center min-w-[60px] sm:min-w-[70px] ${alerts.length > 0 ? 'bg-red-500/40' : 'bg-white/20'}`}>
              <p className="text-xl sm:text-2xl font-bold text-white">{alerts.length}</p>
              <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Alerts</p>
            </div>
            
            {/* Add Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAddModal}
              className="bg-white text-amber-600 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold flex items-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl transition-all whitespace-nowrap text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Feed</span>
              <span className="sm:hidden">Add</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Row */}
      <div className="flex flex-wrap gap-3">
        {/* Items in Stock */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.02 }}
          className="flex-1 min-w-[100px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Layers className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">In Stock</p>
            <p className="text-2xl font-bold text-gray-800">{feeds.length}</p>
            <p className="text-[10px] text-emerald-500 font-medium">feed types</p>
          </div>
        </motion.div>
        
        {/* Alerts */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.02 }}
          className={`flex-1 min-w-[100px] bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3 cursor-pointer hover:shadow-lg transition-all ${alerts.length > 0 ? 'border-red-100 hover:border-red-200' : 'border-gray-100/80 hover:border-amber-200'}`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${alerts.length > 0 ? 'bg-gradient-to-br from-red-100 to-red-50' : 'bg-gradient-to-br from-amber-100 to-amber-50'}`}>
            <AlertTriangle className={`w-6 h-6 ${alerts.length > 0 ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <p className={`text-xs font-medium uppercase tracking-wide ${alerts.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>Alerts</p>
            <p className={`text-2xl font-bold ${alerts.length > 0 ? 'text-red-500' : 'text-gray-800'}`}>{alerts.length}</p>
          </div>
        </motion.div>
        
        {/* Total Consumed - All Time */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.02 }}
          className="flex-1 min-w-[120px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80 flex items-center gap-3 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <TrendingDown className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Total Consumed</p>
            <p className="text-2xl font-bold text-gray-800">{totalConsumption.totalQuantity || 0}</p>
            <p className="text-[10px] text-blue-500 font-medium">kg feeds eaten</p>
          </div>
        </motion.div>
        
        {/* Total Cost of Consumed Feeds */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.02 }}
          className="flex-1 min-w-[140px] bg-gradient-to-r from-red-500 via-red-500 to-rose-500 rounded-2xl p-4 shadow-lg shadow-red-200/50 flex items-center gap-3 text-white cursor-pointer hover:shadow-xl hover:shadow-red-200/70 transition-all"
        >
          <div className="w-12 h-12 bg-white/25 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/10">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Total Feed Cost</p>
            <p className="text-2xl font-bold">₱{(totalConsumption.totalCost/1000).toFixed(1)}k</p>
            <p className="text-[10px] text-white/80 font-medium">lifetime consumption</p>
          </div>
        </motion.div>
      </div>

      {/* Premium Alerts Bar */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="relative bg-white border-l-4 border-red-500 rounded-2xl p-4 shadow-lg shadow-red-100/50 overflow-hidden"
          >
            {/* Subtle red gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-50/80 via-red-50/40 to-transparent -z-10" />
            
            <div className="flex items-center gap-4">
              {/* Animated Alert Icon */}
              <div className="relative flex-shrink-0">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-300"
                >
                  <AlertTriangle className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.div>
                {/* Pulse ring */}
                <motion.div 
                  animate={{ scale: [1, 1.4, 1.4], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 w-14 h-14 bg-red-400 rounded-2xl -z-10"
                />
              </div>
              
              {/* Alert Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Badge */}
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border border-red-200">
                    Low Stock Alert
                  </span>
                  {/* Count Badge */}
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                    {alerts.length} item{alerts.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="mt-1.5">
                  <p className="text-base font-bold text-gray-800 leading-tight">
                    Stock running low
                  </p>
                  <p className="text-sm text-red-600/90 font-medium truncate mt-0.5">
                    {alerts.map(a => a.name).join(', ')}
                    <span className="text-gray-500 font-normal"> needs immediate restocking</span>
                  </p>
                </div>
              </div>
              
              {/* Action Button */}
              <motion.button 
                whileHover={{ scale: 1.03, x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openRestockModal(alerts[0])}
                className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-200 transition-all flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Restock Now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Search */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <Search className="w-5 h-5 text-amber-600" />
        </div>
        <input
          type="text"
          placeholder="Search feeds by name or brand..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-20 py-4 bg-white border border-gray-200/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm hover:shadow-md"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
            {filteredFeeds.length}
          </span>
        </div>
      </div>

      {/* Feed Cards - Chickens Style */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredFeeds.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100"
        >
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wheat className="w-10 h-10 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No feeds found</h3>
          <p className="text-gray-500 text-sm mb-4">Start tracking your feed inventory</p>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAddModal} 
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-amber-200"
          >
            Add your first feed
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredFeeds.map((feed, idx) => (
            <motion.div
              key={feed._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all"
            >
              {/* Card Header with Gradient */}
              <div className={`p-5 ${feed.stock <= feed.lowStockThreshold ? 'bg-gradient-to-r from-red-500 via-red-500 to-rose-500' : 'bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500'}`}>
                <div className="flex items-center justify-between">
                  {/* Left - Icon & Title */}
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center"
                    >
                      <Wheat className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${feed.stock <= feed.lowStockThreshold ? 'bg-red-700/50 text-white' : 'bg-white/20 text-white'}`}>
                          Feed
                        </span>
                        {getStockBadge(feed)}
                      </div>
                      <h3 className="font-bold text-xl text-white mt-0.5">{feed.name}</h3>
                    </div>
                  </div>
                  
                  {/* Right - Actions */}
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEditModal(feed)}
                      className="w-10 h-10 bg-white/25 hover:bg-white/40 backdrop-blur-md rounded-xl transition-all flex items-center justify-center shadow-lg shadow-black/10 group"
                      title="Edit feed"
                    >
                      <Edit2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openDeleteConfirm(feed)}
                      className="w-10 h-10 bg-white/25 hover:bg-red-400/60 backdrop-blur-md rounded-xl transition-all flex items-center justify-center shadow-lg shadow-black/10 group"
                      title="Delete feed"
                    >
                      <Trash2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Card Body - 4 Column Grid */}
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Stock - Blue */}
                  <motion.div 
                    whileHover={{ scale: 1.03, translateY: -2 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-100 shadow-md hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Stock</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">{feed.stock}</span>
                      <span className="text-sm text-gray-500">{feed.unit}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((feed.stock / (feed.lowStockThreshold * 3)) * 100, 100)}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className={`h-full rounded-full ${getStockProgressColor(feed)}`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Alert at {feed.lowStockThreshold}</p>
                  </motion.div>

                  {/* Cost - Amber */}
                  <motion.div 
                    whileHover={{ scale: 1.03, translateY: -2 }}
                    className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 border border-amber-100 shadow-md hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-200">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Cost</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₱{feed.costPerUnit.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">per {feed.unit}</p>
                  </motion.div>

                  {/* Type - Purple */}
                  <motion.div 
                    whileHover={{ scale: 1.03, translateY: -2 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-100 shadow-md hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-200">
                        <Layers className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Type</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 capitalize">{feed.type}</p>
                    {feed.brand && <p className="text-xs text-gray-500 mt-1 truncate">{feed.brand}</p>}
                  </motion.div>

                  {/* Value - Emerald */}
                  <motion.div 
                    whileHover={{ scale: 1.03, translateY: -2 }}
                    className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-100 shadow-md hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                        <TrendingDown className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Value</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">₱{(feed.stock * feed.costPerUnit).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Total inventory value</p>
                  </motion.div>
                </div>

                {/* Supplier Info */}
                {feed.supplier && (
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Store className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Supplier</span>
                        <p className="text-sm text-gray-700 mt-1">{feed.supplier}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Notes */}
                {feed.notes && (
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="mt-3 p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-2xl border border-amber-100/50 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Notes</span>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{feed.notes}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Bottom Actions */}
                <div className="mt-4 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openConsumptionModal(feed)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
                  >
                    <TrendingDown className="w-4 h-4" />
                    Record Usage
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openRestockModal(feed)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-200"
                  >
                    <Package className="w-4 h-4" />
                    Restock
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Today's Feed Usage Section */}
      {todayUsage.records && todayUsage.records.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mt-6"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Today's Feed Usage</h3>
                  <p className="text-white/80 text-sm">Consumption records for today</p>
                </div>
              </div>
              
              {/* Total Stats */}
              <div className="flex gap-3">
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">{todayUsage.total || 0}</p>
                  <p className="text-xs text-white/80 uppercase">kg Used</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">
                    ₱{todayUsage.records.reduce((sum, record) => {
                      const feed = feeds.find(f => f._id === record.feedId)
                      return sum + ((record.quantity || 0) * (feed?.costPerUnit || 0))
                    }, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-white/80 uppercase">Total Cost</p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Records List */}
          <div className="p-5">
            <div className="space-y-3">
              {todayUsage.records.map((record, idx) => {
                const feed = feeds.find(f => f._id === record.feedId)
                const batch = batches.find(b => b._id === record.batchId)
                const cost = (record.quantity || 0) * (feed?.costPerUnit || 0)
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all"
                  >
                    {/* Left - Feed & Batch Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                        <Wheat className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{feed?.name || 'Unknown Feed'}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>Batch: {batch?.batchId || 'Unknown'}</span>
                          <span className="text-gray-300">•</span>
                          <span>{batch?.breed || 'Unknown breed'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right - Quantity & Cost */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg">
                        {record.quantity} {feed?.unit || 'kg'}
                      </p>
                      <p className="text-sm text-emerald-600 font-medium">
                        ₱{cost.toLocaleString()} @ ₱{feed?.costPerUnit || 0}/{feed?.unit || 'kg'}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Summary Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {todayUsage.records.length} consumption record{todayUsage.records.length > 1 ? 's' : ''} today
                </p>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Consumption Value</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ₱{todayUsage.records.reduce((sum, record) => {
                      const feed = feeds.find(f => f._id === record.feedId)
                      return sum + ((record.quantity || 0) * (feed?.costPerUnit || 0))
                    }, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add/Edit Modal - Improved */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingFeed ? 'Edit Feed' : 'Add New Feed'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Feed Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              placeholder="e.g., Premium Layer Feed"
              required
            />
          </div>
          
          {/* Type & Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                required
              >
                <option value="starter">Starter</option>
                <option value="grower">Grower</option>
                <option value="layer">Layer</option>
                <option value="breeder">Breeder</option>
                <option value="medicine">Medicine</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                placeholder="Brand name"
              />
            </div>
          </div>
          
          {/* Stock & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Stock</label>
              <input
                type="number"
                value={formData.stock === 0 ? '' : formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="grams">Grams</option>
                <option value="bags">Bags</option>
                <option value="sacks">Sacks</option>
              </select>
            </div>
          </div>
          
          {/* Cost & Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost per Unit (₱)</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPerUnit === 0 ? '' : formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alert Threshold</label>
              <input
                type="number"
                value={formData.lowStockThreshold === 0 ? '' : formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value === '' ? '' : parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                placeholder="10"
              />
            </div>
          </div>
          
          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier (Optional)</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              placeholder="Supplier name"
            />
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all min-h-[80px] resize-none"
              placeholder="Additional notes..."
            />
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button" 
              onClick={closeModal} 
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-amber-200 hover:shadow-xl transition-all"
            >
              {editingFeed ? 'Update Feed' : 'Add Feed'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal - Beautiful Design */}
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
                <h3 className="text-2xl font-bold text-white">Delete Feed?</h3>
                <p className="text-white/80 text-sm mt-1">This action cannot be undone</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Feed Name */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Wheat className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                    {deleteTarget?.name}
                  </span>
                </div>

                <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-6">
                  <p className="text-sm text-red-800 text-center">
                    <strong>Warning:</strong> Deleting this feed will permanently remove it and all associated consumption records from the database.
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
                    Delete Feed
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record Consumption Modal */}
      <Modal
        isOpen={consumptionModalOpen}
        onClose={closeConsumptionModal}
        title={`Record Feed Usage - ${selectedFeed?.name}`}
      >
        <form onSubmit={handleConsumptionSubmit} className="space-y-4">
          {/* Current Stock Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedFeed?.stock} <span className="text-sm font-normal text-gray-500">{selectedFeed?.unit}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">After recording</p>
                <p className="text-xl font-bold text-blue-600">
                  {Math.max((selectedFeed?.stock || 0) - (parseFloat(consumptionForm.quantity) || 0), 0)} {selectedFeed?.unit}
                </p>
              </div>
            </div>
          </div>

          {/* Quantity Used */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity Used <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={consumptionForm.quantity}
                onChange={(e) => setConsumptionForm({ ...consumptionForm, quantity: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder={`Enter quantity in ${selectedFeed?.unit || 'kg'}...`}
                required
                min="0.01"
                max={selectedFeed?.stock}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                {selectedFeed?.unit}
              </span>
            </div>
          </div>

          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Batch <span className="text-red-500">*</span>
            </label>
            <select
              value={consumptionForm.batchId}
              onChange={(e) => setConsumptionForm({ ...consumptionForm, batchId: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              required
            >
              <option value="">Select batch...</option>
              {batches.map(batch => {
                const currentCount = (batch.quantity || 0) - (batch.mortalityCount || 0) - (batch.soldCount || 0)
                return (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchId} - {batch.breed} ({currentCount} chickens)
                  </option>
                )
              })}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Used</label>
            <input
              type="date"
              value={consumptionForm.date}
              onChange={(e) => setConsumptionForm({ ...consumptionForm, date: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
            <textarea
              value={consumptionForm.notes}
              onChange={(e) => setConsumptionForm({ ...consumptionForm, notes: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[80px] resize-none"
              placeholder="e.g., Fed to Layer Batch A..."
            />
          </div>

          {/* Cost Calculation */}
          {consumptionForm.quantity && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Cost:</span> ₱{(parseFloat(consumptionForm.quantity || 0) * (selectedFeed?.costPerUnit || 0)).toFixed(2)}
              </p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button" 
              onClick={closeConsumptionModal} 
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:shadow-xl transition-all"
            >
              Record Usage
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Quick Restock Modal */}
      <Modal
        isOpen={restockModalOpen}
        onClose={closeRestockModal}
        title={`Restock - ${restockTarget?.name}`}
      >
        <form onSubmit={handleRestockSubmit} className="space-y-4">
          {/* Current Stock Info */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-medium">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {restockTarget?.stock} <span className="text-sm font-normal text-gray-500">{restockTarget?.unit}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">After restock</p>
                <p className="text-xl font-bold text-emerald-600">
                  {(restockTarget?.stock || 0) + (parseFloat(restockQuantity) || 0)} {restockTarget?.unit}
                </p>
              </div>
            </div>
          </div>

          {/* Quantity to Add */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity to Add <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder={`Enter quantity in ${restockTarget?.unit || 'kg'}...`}
                required
                min="0.01"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                {restockTarget?.unit}
              </span>
            </div>
          </div>

          {/* Cost Calculation */}
          {restockQuantity && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-800">
                  <span className="font-semibold">Cost:</span> ₱{(parseFloat(restockQuantity || 0) * (restockTarget?.costPerUnit || 0)).toFixed(2)}
                </span>
                <span className="text-xs text-amber-600">
                  ₱{restockTarget?.costPerUnit?.toFixed(2)} per {restockTarget?.unit}
                </span>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button" 
              onClick={closeRestockModal} 
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
            >
              Add Stock
            </motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}

export default Feeds

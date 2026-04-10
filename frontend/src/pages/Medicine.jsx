import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  Pill, Plus, Search, AlertCircle, Calendar, Package, 
  Edit2, Trash2, X, CheckCircle, Clock, History,
  ChevronDown, ChevronUp, AlertTriangle, TrendingUp, DollarSign, Store
} from 'lucide-react'
import { medicineAPI, medicineScheduleAPI, batchAPI } from '../services/api'
import { useToast } from '../contexts/ToastContext'

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
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
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
        <div className="p-5">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Medicine() {
  const { success, error: showError } = useToast()
  const [activeTab, setActiveTab] = useState('inventory')
  const [medicines, setMedicines] = useState([])
  const [schedules, setSchedules] = useState([])
  const [history, setHistory] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({ totalItems: 0, expiringSoon: 0, lowStock: 0, totalValue: 0 })
  
  // Modal states
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  
  // Delete confirmation modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [medicineToDelete, setMedicineToDelete] = useState(null)
  
  // Form states
  const [medicineForm, setMedicineForm] = useState({
    name: '', type: 'Antibiotic', stock: '', unit: 'bottles', 
    costPerUnit: '', supplier: '', expiryDate: '', lowStockThreshold: 5, notes: ''
  })
  const [scheduleForm, setScheduleForm] = useState({
    medicineId: '', batchId: '', scheduledDate: new Date().toISOString().split('T')[0],
    quantity: 1, dosage: '', notes: ''
  })
  const [restockForm, setRestockForm] = useState({ quantity: '', costPerUnit: '' })

  const medicineTypes = ['Antibiotic', 'Vitamin', 'Dewormer', 'Vaccine', 'Disinfectant', 'Supplement', 'Other']
  const medicineUnits = ['bottles', 'packets', 'tablets', 'ml', 'grams', 'units', 'pieces']

  useEffect(() => {
    // Small delay to ensure auth token is set
    const timer = setTimeout(() => {
      loadData()
    }, 100)
    return () => clearTimeout(timer)
  }, [activeTab])

  const loadData = async (retryCount = 0) => {
    try {
      const token = localStorage.getItem('token')
      if (!token && retryCount < 3) {
        console.log('No token found, retrying...')
        setTimeout(() => loadData(retryCount + 1), 500)
        return
      }
      
      setLoading(true)
      
      // Load medicines and stats
      const [medicinesRes, statsRes, batchesRes] = await Promise.all([
        medicineAPI.getAll(),
        medicineAPI.getStats(),
        batchAPI.getAll()
      ])
      
      setMedicines(medicinesRes.data || [])
      setStats(statsRes.data || { totalItems: 0, expiringSoon: 0, lowStock: 0, totalValue: 0 })
      setBatches(batchesRes.data || [])
      
      // Load schedules or history based on active tab
      if (activeTab === 'schedules') {
        const schedulesRes = await medicineScheduleAPI.getPending()
        setSchedules(schedulesRes.data || [])
      } else if (activeTab === 'history') {
        const historyRes = await medicineScheduleAPI.getHistory()
        setHistory(historyRes.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Medicine CRUD
  const openAddMedicine = () => {
    setEditingMedicine(null)
    setMedicineForm({
      name: '', type: 'Antibiotic', stock: '', unit: 'bottles',
      costPerUnit: '', supplier: '', expiryDate: '', lowStockThreshold: 5, notes: ''
    })
    setIsMedicineModalOpen(true)
  }

  const openEditMedicine = (medicine) => {
    setEditingMedicine(medicine)
    setMedicineForm({
      name: medicine.name,
      type: medicine.type,
      stock: medicine.stock,
      unit: medicine.unit,
      costPerUnit: medicine.costPerUnit || '',
      supplier: medicine.supplier || '',
      expiryDate: medicine.expiryDate ? medicine.expiryDate.split('T')[0] : '',
      lowStockThreshold: medicine.lowStockThreshold || 5,
      notes: medicine.notes || ''
    })
    setIsMedicineModalOpen(true)
  }

  const handleMedicineSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...medicineForm,
        stock: parseInt(medicineForm.stock) || 0,
        costPerUnit: parseFloat(medicineForm.costPerUnit) || 0,
        lowStockThreshold: parseInt(medicineForm.lowStockThreshold) || 5
      }
      
      if (editingMedicine) {
        await medicineAPI.update(editingMedicine._id, data)
        success('Medicine updated successfully!')
      } else {
        await medicineAPI.create(data)
        success('New medicine added successfully!')
      }
      
      loadData()
      setIsMedicineModalOpen(false)
    } catch (error) {
      console.error('Error saving medicine:', error)
      showError(error.response?.data?.message || 'Failed to save medicine')
    }
  }

  const openDeleteConfirm = (id) => {
    setMedicineToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false)
    setMedicineToDelete(null)
  }

  const confirmDeleteMedicine = async () => {
    if (!medicineToDelete) return
    
    // Check if medicine still exists before deleting
    const medicineExists = medicines.find(m => m._id === medicineToDelete)
    if (!medicineExists) {
      alert('Medicine not found in inventory. It may have already been deleted.')
      closeDeleteConfirm()
      await loadData()
      return
    }
    
    try {
      console.log('Deleting medicine ID:', medicineToDelete)
      const response = await medicineAPI.delete(medicineToDelete)
      console.log('Delete response:', response)
      
      // Update local state immediately
      setMedicines(prev => prev.filter(m => m._id !== medicineToDelete))
      
      await loadData()
      closeDeleteConfirm()
      success('Medicine deleted successfully!')
    } catch (error) {
      console.error('Error deleting medicine:', error)
      showError('Failed to delete medicine. Please try again.')
    }
  }

  const handleDeleteMedicine = (id) => {
    openDeleteConfirm(id)
  }

  // Restock
  const openRestockModal = (medicine) => {
    setSelectedMedicine(medicine)
    setRestockForm({ quantity: '', costPerUnit: medicine.costPerUnit || '' })
    setIsRestockModalOpen(true)
  }

  const handleRestock = async (e) => {
    e.preventDefault()
    try {
      await medicineAPI.restock(selectedMedicine._id, {
        quantity: parseInt(restockForm.quantity),
        costPerUnit: parseFloat(restockForm.costPerUnit) || undefined
      })
      loadData()
      setIsRestockModalOpen(false)
      success(`Restocked ${restockForm.quantity} ${selectedMedicine.unit} of ${selectedMedicine.name}`)
    } catch (error) {
      console.error('Error restocking:', error)
      showError(error.response?.data?.message || 'Failed to restock medicine')
    }
  }

  // Schedule
  const openScheduleModal = () => {
    setScheduleForm({
      medicineId: medicines[0]?._id || '',
      batchId: batches[0]?._id || '',
      scheduledDate: new Date().toISOString().split('T')[0],
      quantity: 1, dosage: '', notes: ''
    })
    setIsScheduleModalOpen(true)
  }

  const handleScheduleSubmit = async (e) => {
    e.preventDefault()
    try {
      await medicineScheduleAPI.create({
        ...scheduleForm,
        quantity: parseInt(scheduleForm.quantity) || 1
      })
      loadData()
      setIsScheduleModalOpen(false)
      success('Medication scheduled successfully!')
    } catch (error) {
      console.error('Error creating schedule:', error)
      showError(error.response?.data?.message || 'Failed to create schedule')
    }
  }

  const handleCompleteSchedule = async (scheduleId) => {
    try {
      await medicineScheduleAPI.complete(scheduleId, {})
      loadData()
      success('Medication marked as completed!')
    } catch (error) {
      console.error('Error completing schedule:', error)
      showError('Failed to complete schedule')
    }
  }

  const handleCancelSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to cancel this schedule?')) return
    try {
      await medicineScheduleAPI.cancel(scheduleId)
      loadData()
      success('Schedule cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling schedule:', error)
      showError('Failed to cancel schedule')
    }
  }

  // Filter medicines
  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'bg-emerald-100 text-emerald-700'
      case 'expiring-soon': return 'bg-amber-100 text-amber-700'
      case 'low-stock': return 'bg-red-100 text-red-700'
      case 'expired': return 'bg-gray-100 text-gray-700'
      default: return 'bg-blue-100 text-blue-700'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'good': return 'Good'
      case 'expiring-soon': return 'Expiring Soon'
      case 'low-stock': return 'Low Stock'
      case 'expired': return 'Expired'
      default: return 'Good'
    }
  }

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
        className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl p-4 sm:p-5 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg"
            >
              <Pill className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Medicine</h1>
              <p className="text-white/80 text-xs sm:text-sm">Track inventory & schedules</p>
            </div>
          </div>
          
          {/* Right: Stats + Button */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <div className="bg-white/20 backdrop-blur rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center min-w-[55px] sm:min-w-[70px]">
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalItems}</p>
              <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Items</p>
            </div>
            <div className="bg-amber-500/30 backdrop-blur rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center min-w-[55px] sm:min-w-[70px]">
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.expiringSoon}</p>
              <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Alerts</p>
            </div>
            <div className="bg-red-500/30 backdrop-blur rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center min-w-[55px] sm:min-w-[70px]">
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.lowStock}</p>
              <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Low</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={activeTab === 'inventory' ? openAddMedicine : openScheduleModal}
              className="bg-white text-blue-600 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold flex items-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl transition-all whitespace-nowrap text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{activeTab === 'inventory' ? 'Add' : 'Schedule'}</span>
              <span className="sm:hidden">Add</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tabs - Scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'schedules', label: 'Schedules', icon: Calendar },
          { id: 'history', label: 'History', icon: History }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium capitalize transition-all whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
            </button>
          )
        })}
      </div>


      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Premium Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search medicines by name, type, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Medicine Cards - Feeds Style */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {filteredMedicines.map((med, index) => (
                  <motion.div
                    key={med._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all"
                  >
                    {/* Card Header with Gradient - Feeds Style */}
                    <div className={`p-5 ${
                      med.stock <= med.lowStockThreshold 
                        ? 'bg-gradient-to-r from-red-500 via-red-500 to-rose-500' 
                        : med.status === 'expired'
                        ? 'bg-gradient-to-r from-gray-500 via-gray-500 to-gray-600'
                        : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        {/* Left - Icon & Title */}
                        <div className="flex items-center gap-3">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center"
                          >
                            <Pill className="w-6 h-6 text-white" />
                          </motion.div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                                med.stock <= med.lowStockThreshold 
                                  ? 'bg-red-700/50 text-white' 
                                  : med.status === 'expired'
                                  ? 'bg-gray-700/50 text-white'
                                  : 'bg-white/20 text-white'
                              }`}>
                                {med.type}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                med.stock <= med.lowStockThreshold || med.status === 'expired'
                                  ? 'bg-white/30 text-white'
                                  : getStatusColor(med.status)
                              }`}>
                                {getStatusLabel(med.status)}
                              </span>
                            </div>
                            <h3 className="font-bold text-xl text-white mt-0.5">{med.name}</h3>
                          </div>
                        </div>
                        
                        {/* Right - Actions */}
                        <div className="flex items-center gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); openEditMedicine(med); }}
                            className="w-10 h-10 bg-white/25 hover:bg-white/40 backdrop-blur-md rounded-xl transition-all flex items-center justify-center shadow-lg shadow-black/10 group"
                            title={`Edit ${med.name}`}
                          >
                            <Edit2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteMedicine(med._id); }}
                            className="w-10 h-10 bg-white/25 hover:bg-red-400/60 backdrop-blur-md rounded-xl transition-all flex items-center justify-center shadow-lg shadow-black/10 group"
                            title={`Delete ${med.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Card Body - 4 Column Grid like Feeds */}
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
                            <span className={`text-2xl font-bold ${med.stock <= med.lowStockThreshold ? 'text-red-600' : 'text-gray-900'}`}>
                              {med.stock}
                            </span>
                            <span className="text-sm text-gray-500">{med.unit}</span>
                          </div>
                          {med.stock <= med.lowStockThreshold && (
                            <p className="text-xs text-red-500 mt-1">Alert at {med.lowStockThreshold}</p>
                          )}
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
                          <p className="text-2xl font-bold text-gray-900">₱{med.costPerUnit?.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-gray-500 mt-1">per {med.unit}</p>
                        </motion.div>

                        {/* Type - Purple */}
                        <motion.div 
                          whileHover={{ scale: 1.03, translateY: -2 }}
                          className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-100 shadow-md hover:shadow-xl transition-all"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-200">
                              <Pill className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Type</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">{med.type}</p>
                          {med.brand && <p className="text-xs text-gray-500 mt-1 truncate">{med.brand}</p>}
                        </motion.div>

                        {/* Value - Emerald */}
                        <motion.div 
                          whileHover={{ scale: 1.03, translateY: -2 }}
                          className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-100 shadow-md hover:shadow-xl transition-all"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                              <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Value</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">₱{(med.stock * (med.costPerUnit || 0)).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">Total inventory value</p>
                        </motion.div>
                      </div>

                      {/* Expiry Date */}
                      <motion.div 
                        whileHover={{ scale: 1.01 }}
                        className={`mt-4 p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all ${
                          med.status === 'expired' 
                            ? 'bg-gray-50 border-gray-200' 
                            : med.status === 'expiring-soon'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            med.status === 'expired' ? 'bg-gray-500' : 
                            med.status === 'expiring-soon' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}>
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${
                                  med.status === 'expired' ? 'text-gray-600' :
                                  med.status === 'expiring-soon' ? 'text-amber-600' :
                                  'text-blue-600'
                                }`}>Expires</span>
                                <p className="font-bold text-gray-900 text-lg">
                                  {med.expiryDate 
                                    ? new Date(med.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'No expiry date'
                                  }
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                med.status === 'expired' ? 'bg-gray-200 text-gray-700' :
                                med.status === 'expiring-soon' ? 'bg-amber-200 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {med.status === 'expired' ? 'Expired' :
                                 med.status === 'expiring-soon' ? 'Expiring Soon' :
                                 'Good'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Supplier Info */}
                      {med.supplier && (
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="mt-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Store className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Supplier</span>
                              <p className="text-sm text-gray-700 mt-1">{med.supplier}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Notes */}
                      {med.notes && (
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="mt-3 p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-2xl border border-blue-100/50 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <History className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Notes</span>
                              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{med.notes}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Bottom Actions */}
                      <div className="mt-4 flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => openRestockModal(med)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-200"
                        >
                          <Plus className="w-4 h-4" />
                          Restock
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => openEditMedicine(med)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {filteredMedicines.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
                >
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Package className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No medicines found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search or add a new medicine</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* SCHEDULES TAB */}
          {activeTab === 'schedules' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl shadow-lg border border-blue-200 p-6">
                <h3 className="font-bold text-lg text-gray-800 mb-5 flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  Pending Schedules
                  <span className="ml-auto bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {schedules.length}
                  </span>
                </h3>
                <div className="space-y-4">
                  {schedules.map((schedule, idx) => (
                    <motion.div 
                      key={schedule._id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl p-5 shadow-md border border-blue-100 hover:shadow-lg hover:border-blue-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left - Medicine Info */}
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                            <Pill className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-800">{schedule.medicineId?.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                {schedule.medicineId?.type}
                              </span>
                              <span className="text-sm text-gray-500">
                                Batch: {schedule.batchId?.batchId} - {schedule.batchId?.breed}
                              </span>
                            </div>
                            {/* Quantity & Dosage */}
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                                <span className="text-2xl font-bold text-amber-600">{schedule.quantity}</span>
                                <span className="text-sm text-amber-700 font-medium">{schedule.medicineId?.unit}</span>
                              </div>
                              {schedule.dosage && (
                                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-xl">
                                  <span className="font-medium">Dosage:</span> {schedule.dosage}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Right - Date, Time & Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="text-right bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                            <p className="text-sm font-bold text-gray-800">
                              {new Date(schedule.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              {new Date(schedule.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <span className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                              ⏳ Pending
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCompleteSchedule(schedule._id)}
                              className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-green-200 transition-all flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Complete
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCancelSchedule(schedule._id)}
                              className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
                            >
                              <X className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {schedules.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No pending schedules</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-green-100/50 rounded-2xl shadow-lg border border-emerald-200 p-6">
                <h3 className="font-bold text-lg text-gray-800 mb-5 flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  Completed Medications
                  <span className="ml-auto bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {history.length}
                  </span>
                </h3>
                <div className="space-y-4">
                  {history.map((item, idx) => (
                    <motion.div 
                      key={item._id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl p-5 shadow-md border border-emerald-100 hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left - Medicine Info */}
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 flex-shrink-0">
                            <CheckCircle className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-800">{item.medicineId?.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                                {item.medicineId?.type}
                              </span>
                              <span className="text-sm text-gray-500">
                                Batch: {item.batchId?.batchId} - {item.batchId?.breed}
                              </span>
                            </div>
                            {/* Quantity Used */}
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                                <span className="text-2xl font-bold text-amber-600">{item.quantity || '?'}</span>
                                <span className="text-sm text-amber-700 font-medium">{item.medicineId?.unit} used</span>
                              </div>
                              {item.dosage && (
                                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-xl">
                                  <span className="font-medium">Dosage:</span> {item.dosage}
                                </div>
                              )}
                            </div>
                            {item.notes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Notes:</span> {item.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Right - Date, Time & User */}
                        <div className="text-right bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                          <p className="text-sm font-bold text-gray-800">
                            {new Date(item.administeredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-emerald-600 font-medium mt-1">
                            {new Date(item.administeredDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                {item.administeredBy?.username?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {item.administeredBy?.username || 'Unknown'}
                            </span>
                          </div>
                          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            ✅ Completed
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {history.length === 0 && (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No medication history yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Medicine Modal */}
      <Modal
        isOpen={isMedicineModalOpen}
        onClose={() => setIsMedicineModalOpen(false)}
        title={editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
      >
        <form onSubmit={handleMedicineSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={medicineForm.name}
              onChange={(e) => setMedicineForm({...medicineForm, name: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={medicineForm.type}
                onChange={(e) => setMedicineForm({...medicineForm, type: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {medicineTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={medicineForm.unit}
                onChange={(e) => setMedicineForm({...medicineForm, unit: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {medicineUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                value={medicineForm.stock}
                onChange={(e) => setMedicineForm({...medicineForm, stock: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
              <input
                type="number"
                value={medicineForm.lowStockThreshold}
                onChange={(e) => setMedicineForm({...medicineForm, lowStockThreshold: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                min="1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (₱)</label>
              <input
                type="number"
                step="0.01"
                value={medicineForm.costPerUnit}
                onChange={(e) => setMedicineForm({...medicineForm, costPerUnit: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={medicineForm.expiryDate}
                onChange={(e) => setMedicineForm({...medicineForm, expiryDate: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              value={medicineForm.supplier}
              onChange={(e) => setMedicineForm({...medicineForm, supplier: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={medicineForm.notes}
              onChange={(e) => setMedicineForm({...medicineForm, notes: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              rows="2"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsMedicineModalOpen(false)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
            >
              {editingMedicine ? 'Update' : 'Add'} Medicine
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Medication"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medicine *</label>
            <select
              value={scheduleForm.medicineId}
              onChange={(e) => setScheduleForm({...scheduleForm, medicineId: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            >
              <option value="">Select medicine...</option>
              {medicines.map(med => (
                <option key={med._id} value={med._id}>
                  {med.name} ({med.stock} {med.unit} available)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
            <select
              value={scheduleForm.batchId}
              onChange={(e) => setScheduleForm({...scheduleForm, batchId: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            >
              <option value="">Select batch...</option>
              {batches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchId} - {batch.breed}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={scheduleForm.scheduledDate}
                onChange={(e) => setScheduleForm({...scheduleForm, scheduledDate: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                value={scheduleForm.quantity}
                onChange={(e) => setScheduleForm({...scheduleForm, quantity: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
                min="1"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Instructions</label>
            <input
              type="text"
              value={scheduleForm.dosage}
              onChange={(e) => setScheduleForm({...scheduleForm, dosage: e.target.value})}
              placeholder="e.g., 5ml per chicken"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              rows="2"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
            >
              Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Premium Restock Modal */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title={`Restock ${selectedMedicine?.name}`}
      >
        <form onSubmit={handleRestock} className="space-y-5">
          {/* Current Stock Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-2xl border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Current Stock</p>
                <p className="text-2xl font-bold text-gray-800">
                  {selectedMedicine?.stock} <span className="text-sm font-normal text-gray-500">{selectedMedicine?.unit}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity to Add *</label>
            <div className="relative">
              <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
              <input
                type="number"
                value={restockForm.quantity}
                onChange={(e) => setRestockForm({...restockForm, quantity: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all text-lg font-semibold"
                placeholder="Enter quantity..."
                required
                min="1"
                autoFocus
              />
            </div>
          </div>
          
          {/* Cost Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cost per Unit (₱)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
              <input
                type="number"
                step="0.01"
                value={restockForm.costPerUnit}
                onChange={(e) => setRestockForm({...restockForm, costPerUnit: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRestockModalOpen(false)}
              className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Restock
              </span>
            </button>
          </div>
        </form>
      </Modal>

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
                <h3 className="text-2xl font-bold text-white">Delete Medicine?</h3>
                <p className="text-white/80 text-sm mt-1">This action cannot be undone</p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-6">
                  <p className="text-sm text-red-800 text-center">
                    <strong>Warning:</strong> Deleting this medicine will permanently remove it and all associated schedules from the database.
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
                    onClick={confirmDeleteMedicine}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    Delete Medicine
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

export default Medicine

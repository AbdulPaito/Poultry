import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  Pill, Plus, Search, AlertCircle, Calendar, Package, 
  Edit2, Trash2, X, CheckCircle, Clock, History,
  ChevronDown, ChevronUp, AlertTriangle, TrendingUp, DollarSign
} from 'lucide-react'
import { medicineAPI, medicineScheduleAPI, batchAPI } from '../services/api'

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
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
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
      } else {
        await medicineAPI.create(data)
      }
      
      loadData()
      setIsMedicineModalOpen(false)
    } catch (error) {
      console.error('Error saving medicine:', error)
      alert(error.response?.data?.message || 'Failed to save medicine')
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
    try {
      await medicineAPI.delete(medicineToDelete)
      loadData()
      closeDeleteConfirm()
    } catch (error) {
      console.error('Error deleting medicine:', error)
      alert('Failed to delete medicine: ' + (error.response?.data?.message || error.message))
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
    } catch (error) {
      console.error('Error restocking:', error)
      alert(error.response?.data?.message || 'Failed to restock')
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
    } catch (error) {
      console.error('Error creating schedule:', error)
      alert(error.response?.data?.message || 'Failed to create schedule')
    }
  }

  const handleCompleteSchedule = async (scheduleId) => {
    try {
      await medicineScheduleAPI.complete(scheduleId, {})
      loadData()
    } catch (error) {
      console.error('Error completing schedule:', error)
      alert('Failed to complete schedule')
    }
  }

  const handleCancelSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to cancel this schedule?')) return
    try {
      await medicineScheduleAPI.cancel(scheduleId)
      loadData()
    } catch (error) {
      console.error('Error cancelling schedule:', error)
      alert('Failed to cancel schedule')
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

              {/* Modern Medicine Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMedicines.map((med, index) => (
                  <motion.div
                    key={med._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={`bg-white rounded-2xl p-5 border-2 shadow-lg transition-all cursor-pointer ${
                      med.stock <= med.lowStockThreshold 
                        ? 'border-red-200 shadow-red-100' 
                        : med.status === 'expired'
                        ? 'border-gray-200 shadow-gray-100 opacity-60'
                        : 'border-gray-100 hover:border-blue-200 shadow-blue-50/50'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          med.type === 'Antibiotic' ? 'bg-purple-100' :
                          med.type === 'Vaccine' ? 'bg-green-100' :
                          med.type === 'Vitamin' ? 'bg-yellow-100' :
                          med.type === 'Dewormer' ? 'bg-orange-100' :
                          'bg-blue-100'
                        }`}>
                          <Pill className={`w-6 h-6 ${
                            med.type === 'Antibiotic' ? 'text-purple-600' :
                            med.type === 'Vaccine' ? 'text-green-600' :
                            med.type === 'Vitamin' ? 'text-yellow-600' :
                            med.type === 'Dewormer' ? 'text-orange-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{med.name}</h3>
                          <p className="text-xs text-gray-500">{med.brand || med.supplier || 'No supplier'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(med.status)}`}>
                        {getStatusLabel(med.status)}
                      </span>
                    </div>
                    
                    {/* Card Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Stock</p>
                        <p className={`font-bold text-lg ${med.stock <= med.lowStockThreshold ? 'text-red-600' : 'text-gray-800'}`}>
                          {med.stock} <span className="text-sm font-normal">{med.unit}</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Expires</p>
                        <p className="font-bold text-gray-800">
                          {med.expiryDate 
                            ? new Date(med.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                        {med.type}
                      </span>
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); openRestockModal(med); }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="Restock"
                        >
                          <Plus className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); openEditMedicine(med); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); handleDeleteMedicine(med._id); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Pending Schedules
                </h3>
                <div className="space-y-3">
                  {schedules.map((schedule) => (
                    <div key={schedule._id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Pill className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{schedule.medicineId?.name}</p>
                          <p className="text-sm text-gray-500">
                            Batch: {schedule.batchId?.batchId} - {schedule.batchId?.breed}
                          </p>
                          <p className="text-xs text-blue-600">
                            {schedule.quantity} {schedule.medicineId?.unit} • {schedule.dosage}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(schedule.scheduledDate).toLocaleDateString()}
                          </p>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                            Pending
                          </span>
                        </div>
                        <button
                          onClick={() => handleCompleteSchedule(schedule._id)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleCancelSchedule(schedule._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-green-500" />
                  Completed Medications
                </h3>
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{item.medicineId?.name}</p>
                          <p className="text-sm text-gray-500">
                            Batch: {item.batchId?.batchId} - {item.batchId?.breed}
                          </p>
                          {item.notes && <p className="text-xs text-gray-400">{item.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(item.administeredDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          By: {item.administeredBy?.username}
                        </p>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                          Completed
                        </span>
                      </div>
                    </div>
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

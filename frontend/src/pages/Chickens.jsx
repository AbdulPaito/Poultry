import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Calendar,
  Bird,
  CheckCircle,
  AlertCircle,
  Tag,
  Users,
  Clock,
  Store,
  FileText,
  Skull,
  AlertTriangle
} from 'lucide-react'
import { batchAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
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
    </AnimatePresence>
  )
}

// Field Label Component
function FieldLabel({ icon: Icon, label, value, subValue, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-50 text-gray-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700'
  }
  
  return (
    <div className={`rounded-lg p-3 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 opacity-60" />
        <span className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="font-semibold text-lg">{value}</p>
      {subValue && <p className="text-xs opacity-70 mt-1">{subValue}</p>}
    </div>
  )
}

function Chickens() {
  const { success, error: showError } = useToast()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [mortalityModalOpen, setMortalityModalOpen] = useState(false)
  const [editMortalityModalOpen, setEditMortalityModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [editingMortalityIndex, setEditingMortalityIndex] = useState(null)
  const [editMortalityForm, setEditMortalityForm] = useState({
    count: 1,
    date: '',
    reason: '',
    notes: ''
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState({ batchId: null, recordIndex: null })
  
  // Batch delete confirmation
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState(null)
  const [showMortalityHistory, setShowMortalityHistory] = useState({})
  const [mortalityForm, setMortalityForm] = useState({
    count: 1,
    date: new Date().toISOString().split('T')[0],
    reason: '',
    notes: ''
  })
  const [formData, setFormData] = useState({
    batchId: '',
    breed: '',
    quantity: '',
    dateAcquired: new Date().toISOString().split('T')[0],
    source: '',
    notes: ''
  })

  useEffect(() => {
    // Small delay to ensure auth token is set
    const timer = setTimeout(() => {
      loadBatches()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const loadBatches = async (retryCount = 0) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('No token found, waiting...')
        if (retryCount < 3) {
          setTimeout(() => loadBatches(retryCount + 1), 500)
          return
        }
      }
      
      const response = await batchAPI.getAll()
      console.log('Loaded batches:', response.data)
      setBatches(response.data || [])
      return response.data
    } catch (error) {
      console.error('Error loading batches:', error)
      // If 401, don't clear data - might be auth delay
      if (error.response?.status !== 401) {
        setBatches([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingBatch) {
        // Update existing batch
        const response = await batchAPI.update(editingBatch._id, formData)
        console.log('Batch updated:', response.data)
        
        // Update local state immediately for better UX
        setBatches(prev => prev.map(b => 
          b._id === editingBatch._id ? { ...b, ...formData } : b
        ))
      } else {
        // Create new batch
        const response = await batchAPI.create(formData)
        console.log('Batch created:', response.data)
      }
      
      // Reload batches to ensure sync with backend
      await loadBatches()
      closeModal()
      success(editingBatch ? 'Batch updated successfully!' : 'New batch added successfully!')
    } catch (error) {
      console.error('Error saving batch:', error)
      showError('Failed to save batch. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openBatchDeleteConfirm = (id) => {
    setBatchToDelete(id)
    setBatchDeleteOpen(true)
  }

  const closeBatchDeleteConfirm = () => {
    setBatchDeleteOpen(false)
    setBatchToDelete(null)
  }

  const confirmBatchDelete = async () => {
    if (!batchToDelete) return
    setLoading(true)
    try {
      await batchAPI.delete(batchToDelete)
      // Remove from local state immediately
      setBatches(prev => prev.filter(b => b._id !== batchToDelete))
      await loadBatches()
      closeBatchDeleteConfirm()
      success('Batch deleted successfully!')
    } catch (error) {
      console.error('Error deleting batch:', error)
      showError('Failed to delete batch. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id) => {
    openBatchDeleteConfirm(id)
  }

  const openAddModal = () => {
    setEditingBatch(null)
    setFormData({
      batchId: '',
      breed: '',
      quantity: '',
      dateAcquired: new Date().toISOString().split('T')[0],
      source: '',
      notes: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (batch) => {
    setEditingBatch(batch)
    setFormData({
      batchId: batch.batchId,
      breed: batch.breed,
      quantity: batch.quantity,
      dateAcquired: batch.dateAcquired.split('T')[0],
      source: batch.source || '',
      notes: batch.notes || ''
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBatch(null)
  }

  const openMortalityModal = (batch) => {
    setSelectedBatch(batch)
    setMortalityForm({
      count: 1,
      date: new Date().toISOString().split('T')[0],
      reason: '',
      notes: ''
    })
    setMortalityModalOpen(true)
  }

  const closeMortalityModal = () => {
    setMortalityModalOpen(false)
    setSelectedBatch(null)
  }

  const toggleMortalityHistory = (batchId) => {
    setShowMortalityHistory(prev => ({
      ...prev,
      [batchId]: !prev[batchId]
    }))
  }

  const openDeleteConfirm = (batchId, recordIndex) => {
    setDeleteTarget({ batchId, recordIndex })
    setDeleteConfirmOpen(true)
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false)
    setDeleteTarget({ batchId: null, recordIndex: null })
  }

  const confirmDeleteMortality = async () => {
    const { batchId, recordIndex } = deleteTarget
    if (!batchId || recordIndex === null) return

    const batch = batches.find(b => b._id === batchId)
    const record = batch?.mortalityRecords?.[recordIndex]
    if (!record) {
      alert('Record not found')
      return
    }

    console.log('Deleting record:', record)
    console.log('Current mortalityCount:', batch.mortalityCount)

    const updatedRecords = batch.mortalityRecords.filter((_, idx) => idx !== recordIndex)
    const newMortalityCount = Math.max(0, (batch.mortalityCount || 0) - record.count)

    console.log('New mortalityCount:', newMortalityCount)
    console.log('Updated records count:', updatedRecords.length)

    try {
      // Update backend
      const response = await batchAPI.update(batchId, {
        mortalityCount: newMortalityCount,
        mortalityRecords: updatedRecords
      })
      console.log('Backend response:', response)

      // Update local state
      setBatches(prev => prev.map(b => 
        b._id === batchId ? {
          ...b,
          mortalityCount: newMortalityCount,
          mortalityRecords: updatedRecords
        } : b
      ))
    } catch (error) {
      console.error('Error deleting mortality:', error)
      // Show error in modal instead of alert
      alert('Failed to delete record: ' + error.message)
    }

    closeDeleteConfirm()
  }

  const openEditMortalityModal = (batchId, recordIndex) => {
    const batch = batches.find(b => b._id === batchId)
    if (!batch?.mortalityRecords?.[recordIndex]) return

    const record = batch.mortalityRecords[recordIndex]
    setSelectedBatch(batch)
    setEditingMortalityIndex(recordIndex)
    setEditMortalityForm({
      count: record.count,
      date: record.date,
      reason: record.reason || '',
      notes: record.notes || ''
    })
    setEditMortalityModalOpen(true)
  }

  const closeEditMortalityModal = () => {
    setEditMortalityModalOpen(false)
    setSelectedBatch(null)
    setEditingMortalityIndex(null)
    setEditMortalityForm({ count: 1, date: '', reason: '', notes: '' })
  }

  const handleEditMortalitySubmit = async (e) => {
    e.preventDefault()
    if (!selectedBatch || editingMortalityIndex === null) return

    const batch = selectedBatch
    const record = batch.mortalityRecords[editingMortalityIndex]
    const oldCount = record.count
    const newCount = parseInt(editMortalityForm.count) || oldCount
    const countDiff = newCount - oldCount

    const updatedRecords = [...batch.mortalityRecords]
    updatedRecords[editingMortalityIndex] = {
      ...record,
      ...editMortalityForm,
      count: newCount
    }

    const newMortalityCount = Math.max(0, (batch.mortalityCount || 0) + countDiff)

    try {
      // Update backend
      await batchAPI.update(batch._id, {
        mortalityCount: newMortalityCount,
        mortalityRecords: updatedRecords
      })

      // Update local state
      setBatches(prev => prev.map(b => 
        b._id === batch._id ? {
          ...b,
          mortalityCount: newMortalityCount,
          mortalityRecords: updatedRecords
        } : b
      ))

      closeEditMortalityModal()
      success('Mortality record updated successfully!')
    } catch (error) {
      console.error('Error updating mortality:', error)
      showError('Failed to update mortality record.')
    }
  }

  const handleMortalitySubmit = async (e) => {
    e.preventDefault()
    if (!selectedBatch) return

    try {
      const count = parseInt(mortalityForm.count)
      const newMortalityCount = (selectedBatch.mortalityCount || 0) + count
      const newRecords = [
        ...(selectedBatch.mortalityRecords || []),
        {
          ...mortalityForm,
          count: count,
          id: Date.now()
        }
      ]

      // Update backend first
      await batchAPI.update(selectedBatch._id, {
        mortalityCount: newMortalityCount,
        mortalityRecords: newRecords
      })

      // Update local state after successful backend update
      setBatches(prev => prev.map(b => 
        b._id === selectedBatch._id ? {
          ...b,
          mortalityCount: newMortalityCount,
          mortalityRecords: newRecords
        } : b
      ))

      closeMortalityModal()
      success(`Recorded ${mortalityForm.count} dead chicken(s)`)
    } catch (error) {
      console.error('Error recording mortality:', error)
      showError('Failed to save mortality record. Please try again.')
    }
  }

  const calculateAge = (dateAcquired) => {
    const days = Math.floor((new Date() - new Date(dateAcquired)) / (1000 * 60 * 60 * 24))
    return days
  }

  const getCurrentQuantity = (batch) => {
    return batch.quantity - (batch.mortalityCount || 0) - (batch.soldCount || 0)
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      sold: 'bg-blue-100 text-blue-700 border-blue-200',
      retired: 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return styles[status] || styles.retired
  }

  const filteredBatches = batches
    .filter(batch =>
      batch.batchId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.breed?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by batchId (alphanumeric sorting)
      return a.batchId.localeCompare(b.batchId, undefined, { numeric: true, sensitivity: 'base' })
    })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Colorful Header with Gradient */}
      <div className="glass-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-500 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left - Title & Icon */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
                <Bird className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Chicken Management</h2>
                <p className="text-white/80 text-sm mt-1">Manage your poultry batches</p>
              </div>
            </div>
            
            {/* Right - Stats & Button */}
            <div className="flex items-center gap-4">
              {/* Quick Stats */}
              <div className="hidden md:flex gap-3">
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">{filteredBatches.length}</p>
                  <p className="text-xs text-white/80 uppercase">Batches</p>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center">
                  <p className="text-2xl font-bold text-white">
                    {filteredBatches.reduce((sum, b) => sum + getCurrentQuantity(b), 0)}
                  </p>
                  <p className="text-xs text-white/80 uppercase">Chickens</p>
                </div>
              </div>
              
              {/* Dead Count Badge - Beside Add Button */}
              <div className="bg-red-600 rounded-xl px-4 py-2 text-center shadow-lg">
                <p className="text-2xl font-bold text-white">
                  {filteredBatches.reduce((sum, b) => sum + (b.mortalityCount || 0), 0)}
                </p>
                <p className="text-xs text-white/90 uppercase font-semibold">Dead</p>
              </div>
              
              {/* Add Button */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={openAddModal}
                className="bg-white text-primary-600 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Batch
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Quick Filters Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-primary-50 to-emerald-50 border-t border-primary-100 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-primary-700">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="font-medium">{filteredBatches.filter(b => b.status === 'active').length} Active</span>
          </div>
          <div className="h-4 w-px bg-primary-200" />
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="font-medium">
              {filteredBatches.reduce((sum, b) => sum + getCurrentQuantity(b), 0)} Total Chickens
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search batches by ID or breed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Batches Table/Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bird className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No batches found</p>
          <button onClick={openAddModal} className="text-primary-600 font-medium mt-2">
            Add your first batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Batch Cards */}
          {filteredBatches.map((batch) => (
            <motion.div
              key={batch._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                y: -4
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="glass-card overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Card Header - Compact */}
              <div className="p-4 bg-gradient-to-r from-primary-50/80 to-emerald-50/30 border-b border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Compact Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bird className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Batch Info - Compact */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-primary-600 uppercase bg-primary-100 px-1.5 py-0.5 rounded">ID</span>
                        <h3 className="font-bold text-2xl text-gray-900">{batch.batchId}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(batch.status)}`}>
                          {batch.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-gray-500">Breed:</span>
                        <span className="font-semibold text-gray-800">{batch.breed}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* Top Row - Main Actions */}
                    <div className="flex items-center gap-2">
                        {/* Edit Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditModal(batch)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-md shadow-blue-200"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </motion.button>
                      
                      {/* Delete Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(batch._id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors shadow-md shadow-gray-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </motion.button>
                    </div>
                    
                  </div>
                </div>
              </div>

              {/* Card Body - 3D Animated Grid */}
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Quantity - 3D with Chart */}
                  <motion.div 
                    whileHover={{ scale: 1.03, translateY: -2 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-100 shadow-md hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Chickens</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">{getCurrentQuantity(batch)}</span>
                      <span className="text-sm text-gray-500 font-medium">/ {batch.quantity}</span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(getCurrentQuantity(batch) / batch.quantity) * 100}%` }}
                      />
                    </div>
                    {(batch.mortalityCount > 0 || batch.soldCount > 0) && (
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        -{batch.mortalityCount || 0} mortality, -{batch.soldCount || 0} sold
                      </p>
                    )}
                  </motion.div>

                  {/* Date - 3D */}
                  <motion.div 
                    whileHover={{ scale: 1.03, translateY: -2 }}
                    className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 border border-amber-100 shadow-md hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-200">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Acquired</span>
                    </div>
                    <p className="font-bold text-gray-900 text-lg">{new Date(batch.dateAcquired).toLocaleDateString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      <p className="text-xs text-gray-600 font-medium">{calculateAge(batch.dateAcquired)} days old</p>
                    </div>
                  </motion.div>

                  {/* Breed - 3D */}
                  <motion.div 
                    whileHover={{ scale: 1.03, translateY: -2 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-100 shadow-md hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-200">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Type</span>
                    </div>
                    <p className="font-bold text-gray-900 text-lg line-clamp-2">{batch.breed}</p>
                  </motion.div>

                  {/* Source - 3D */}
                  <motion.div 
                    whileHover={{ scale: 1.03, translateY: -2 }}
                    className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-100 shadow-md hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                        <Store className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Source</span>
                    </div>
                    <p className="font-bold text-gray-900 text-lg line-clamp-2">{batch.source || 'Not specified'}</p>
                  </motion.div>
                </div>

                {/* Notes - 3D */}
                {batch.notes && (
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Notes</span>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">{batch.notes}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Mortality Section - Below Notes */}
                <div className="mt-3 flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openMortalityModal(batch)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Record Death
                  </motion.button>
                  
                  {batch.mortalityCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleMortalityHistory(batch._id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors border border-amber-300"
                    >
                      <FileText className="w-4 h-4" />
                      {showMortalityHistory[batch._id] ? 'Hide' : 'View'} ({batch.mortalityCount})
                    </motion.button>
                  )}
                </div>
                
                {showMortalityHistory[batch._id] && (
                  <div className="mt-2 bg-red-50 rounded-lg p-2 border border-red-200 max-h-40 overflow-y-auto">
                    <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Dead Chickens History ({batch.mortalityRecords?.length || 0} records)
                    </p>
                    {batch.mortalityRecords && batch.mortalityRecords.length > 0 ? (
                      [...batch.mortalityRecords]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((record, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 mb-2 border border-red-100">
                          {/* Header with Date Badge */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                                DEAD
                              </span>
                              <span className="font-bold text-red-700 text-sm">{record.count} chicken(s)</span>
                              <span className="text-xs text-gray-500 ml-2">
                                on {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditMortalityModal(batch._id, idx)}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => openDeleteConfirm(batch._id, idx)}
                                className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div className="text-xs text-gray-600 space-y-1 pl-1">
                            <p><span className="font-medium">Reason:</span> <span className="text-red-600">{record.reason || 'Unknown'}</span></p>
                            {record.notes && (
                              <p><span className="font-medium">Notes:</span> {record.notes}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-lg p-3 border border-red-100 text-center">
                        <p className="text-xs text-red-600">
                          {batch.mortalityCount} chickens died but no detailed records found.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Health Status Footer - Animated */}
              {getCurrentQuantity(batch) === batch.quantity ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100/30 border-t border-emerald-100"
                >
                  <div className="flex items-center gap-2 text-emerald-700">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </motion.div>
                    <span className="font-medium">All chickens healthy — No mortality recorded</span>
                  </div>
                </motion.div>
              ) : batch.mortalityCount > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-5 py-3 bg-gradient-to-r from-red-50 to-red-100/30 border-t border-red-100"
                >
                  <div className="flex items-center gap-2 text-red-700">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <AlertCircle className="w-5 h-5" />
                    </motion.div>
                    <span className="font-medium">
                      {batch.mortalityCount} mortality recorded — Monitor batch health
                    </span>
                  </div>
                </motion.div>
              ) : null}

            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBatch ? 'Edit Batch' : 'Add New Batch'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Batch ID
              </span>
            </label>
            <input
              type="text"
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="input-field"
              placeholder="e.g., A-001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <Bird className="w-4 h-4" />
                Breed
              </span>
            </label>
            <input
              type="text"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              className="input-field"
              placeholder="e.g., Rhode Island Red"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Quantity (Number of Chickens)
              </span>
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="input-field"
              placeholder="Enter quantity"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Acquired
              </span>
            </label>
            <input
              type="date"
              value={formData.dateAcquired}
              onChange={(e) => setFormData({ ...formData, dateAcquired: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Source (Optional)
              </span>
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="input-field"
              placeholder="Where did you acquire them?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes (Optional)
              </span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder="Any additional notes about this batch..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={closeModal} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {editingBatch ? 'Update' : 'Add'} Batch
            </button>
          </div>
        </form>
      </Modal>

      {/* Mortality Recording Modal */}
      <Modal
        isOpen={mortalityModalOpen}
        onClose={closeMortalityModal}
        title={`Record Dead Chickens - ${selectedBatch?.batchId || ''}`}
      >
        <form onSubmit={handleMortalitySubmit} className="space-y-4">
          {/* Batch Info */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-sm text-red-700">
              Recording mortality for <strong>{selectedBatch?.breed}</strong>
            </p>
            <p className="text-xs text-red-600 mt-1">
              Current quantity: {selectedBatch ? getCurrentQuantity(selectedBatch) : 0} chickens
            </p>
          </div>

          {/* Number Died */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Number of Chickens Died
              </span>
            </label>
            <input
              type="number"
              min="1"
              max={selectedBatch ? getCurrentQuantity(selectedBatch) : 1}
              value={mortalityForm.count}
              onChange={(e) => setMortalityForm({ ...mortalityForm, count: e.target.value })}
              className="input-field"
              placeholder="How many died?"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Death
              </span>
            </label>
            <input
              type="date"
              value={mortalityForm.date}
              onChange={(e) => setMortalityForm({ ...mortalityForm, date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Reason/Cause (Optional)
              </span>
            </label>
            <select
              value={mortalityForm.reason}
              onChange={(e) => setMortalityForm({ ...mortalityForm, reason: e.target.value })}
              className="input-field"
            >
              <option value="">Select reason...</option>
              <option value="Disease">Disease</option>
              <option value="Predator">Predator Attack</option>
              <option value="Accident">Accident</option>
              <option value="Unknown">Unknown</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Additional Notes (Optional)
              </span>
            </label>
            <textarea
              value={mortalityForm.notes}
              onChange={(e) => setMortalityForm({ ...mortalityForm, notes: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder="Any additional details about the incident..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={closeMortalityModal} 
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              Record Deaths
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Mortality Modal */}
      <Modal
        isOpen={editMortalityModalOpen}
        onClose={closeEditMortalityModal}
        title="Edit Mortality Record"
      >
        <form onSubmit={handleEditMortalitySubmit} className="space-y-4">
          {/* Number Died */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Number of Chickens Died
              </span>
            </label>
            <input
              type="number"
              min="1"
              value={editMortalityForm.count}
              onChange={(e) => setEditMortalityForm({ ...editMortalityForm, count: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Death
              </span>
            </label>
            <input
              type="date"
              value={editMortalityForm.date}
              onChange={(e) => setEditMortalityForm({ ...editMortalityForm, date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Reason/Cause
              </span>
            </label>
            <select
              value={editMortalityForm.reason}
              onChange={(e) => setEditMortalityForm({ ...editMortalityForm, reason: e.target.value })}
              className="input-field"
            >
              <option value="">Select reason...</option>
              <option value="Disease">Disease</option>
              <option value="Predator">Predator Attack</option>
              <option value="Accident">Accident</option>
              <option value="Unknown">Unknown</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes (Optional)
              </span>
            </label>
            <textarea
              value={editMortalityForm.notes}
              onChange={(e) => setEditMortalityForm({ ...editMortalityForm, notes: e.target.value })}
              className="input-field min-h-[80px] resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={closeEditMortalityModal} 
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Update Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
        title="Delete Mortality Record"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you sure?</h3>
          <p className="text-gray-600 mb-6">This will permanently delete this mortality record.</p>
          <div className="flex gap-3">
            <button 
              onClick={closeDeleteConfirm} 
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDeleteMortality}
              className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Beautiful Batch Delete Confirmation Modal */}
      <AnimatePresence>
        {batchDeleteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeBatchDeleteConfirm}
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
                <h3 className="text-2xl font-bold text-white">Delete Batch?</h3>
                <p className="text-white/80 text-sm mt-1">This action cannot be undone</p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-6">
                  <p className="text-sm text-red-800 text-center">
                    <strong>Warning:</strong> Deleting this batch will permanently remove all associated records including mortality history and production data.
                  </p>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeBatchDeleteConfirm}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(239, 68, 68, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmBatchDelete}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    Delete Batch
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

export default Chickens

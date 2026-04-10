import { motion } from 'framer-motion'
import { 
  FileText, Download, Calendar, TrendingUp, PieChart, BarChart3, 
  DollarSign, Egg, AlertCircle, ArrowUp, ArrowDown, Package,
  Pill, Wheat, Filter, RefreshCw, ChevronDown, ChevronUp,
  DollarSignIcon, TrendingDown, AlertTriangle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { reportAPI } from '../services/api'

function Reports() {
  const [dateRange, setDateRange] = useState('last30')
  const [activeReport, setActiveReport] = useState('financial')
  const [loading, setLoading] = useState(false)
  
  // Data states
  const [financialData, setFinancialData] = useState(null)
  const [eggProduction, setEggProduction] = useState(null)
  const [mortalityData, setMortalityData] = useState(null)
  const [feedCosts, setFeedCosts] = useState(null)
  const [medicineCosts, setMedicineCosts] = useState(null)
  const [eggPrices, setEggPrices] = useState(null)
  
  // Date range handling
  const getDateRange = () => {
    const today = new Date()
    let startDate, endDate
    
    switch(dateRange) {
      case 'last7':
        startDate = new Date(today.setDate(today.getDate() - 7))
        endDate = new Date()
        break
      case 'last30':
        startDate = new Date(today.setDate(today.getDate() - 30))
        endDate = new Date()
        break
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date()
        break
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      default:
        startDate = new Date(today.setDate(today.getDate() - 30))
        endDate = new Date()
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  useEffect(() => {
    loadAllReports()
  }, [dateRange])

  const loadAllReports = async () => {
    setLoading(true)
    const { startDate, endDate } = getDateRange()
    const params = { startDate, endDate }
    
    try {
      const [financial, eggProd, mortality, feed, medicine, prices] = await Promise.all([
        reportAPI.getFinancialSummary(params),
        reportAPI.getEggProduction(params),
        reportAPI.getMortality(),
        reportAPI.getFeedCosts(params),
        reportAPI.getMedicineCosts(params),
        reportAPI.getEggPrices()
      ])
      
      setFinancialData(financial.data)
      setEggProduction(eggProd.data)
      setMortalityData(mortality.data)
      setFeedCosts(feed.data)
      setMedicineCosts(medicine.data)
      setEggPrices(prices.data)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return `₱${(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const reportTypes = [
    {
      id: 'financial',
      title: 'Financial Summary',
      description: 'Income, expenses & profit overview',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'egg-production',
      title: 'Egg Production + Revenue',
      description: 'Production with sales revenue per size',
      icon: Egg,
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'mortality',
      title: 'Chicken/Mortality Report',
      description: 'Mortality analysis by batch',
      icon: AlertCircle,
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 'feed-costs',
      title: 'Feed Consumption Costs',
      description: 'Feed usage and cost analysis',
      icon: Wheat,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'medicine-costs',
      title: 'Medicine Usage Costs',
      description: 'Medicine applications and costs',
      icon: Pill,
      color: 'from-violet-500 to-purple-500'
    }
  ]

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
        className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl p-4 sm:p-5 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg"
            >
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Reports</h1>
              <p className="text-white/80 text-xs sm:text-sm">Financial overview & analytics</p>
            </div>
          </div>
          
          {/* Right: Stats + Controls */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {financialData && (
              <>
                <div className="bg-white/20 backdrop-blur rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center min-w-[55px] sm:min-w-[70px]">
                  <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(financialData.income?.total).replace('₱', '')}</p>
                  <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Income</p>
                </div>
                <div className="bg-red-500/30 backdrop-blur rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center min-w-[55px] sm:min-w-[70px]">
                  <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(financialData.expenses?.total).replace('₱', '')}</p>
                  <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Exp</p>
                </div>
                <div className={`${financialData.profit?.isProfitable ? 'bg-emerald-500/30' : 'bg-red-500/30'} backdrop-blur rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center min-w-[55px] sm:min-w-[70px]`}>
                  <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(financialData.profit?.netIncome).replace('₱', '')}</p>
                  <p className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wide">Profit</p>
                </div>
              </>
            )}
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white/20 backdrop-blur text-white px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold border border-white/30 focus:outline-none text-xs sm:text-sm"
            >
              <option value="last7" className="text-gray-800">7d</option>
              <option value="last30" className="text-gray-800">30d</option>
              <option value="thisMonth" className="text-gray-800">This</option>
              <option value="lastMonth" className="text-gray-800">Last</option>
            </select>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadAllReports}
              className="p-2 sm:p-2.5 bg-white/20 backdrop-blur rounded-lg sm:rounded-xl text-white hover:bg-white/30 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {reportTypes.map((report) => {
          const Icon = report.icon
          const isActive = activeReport === report.id
          
          return (
            <motion.button
              key={report.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveReport(report.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                isActive 
                  ? 'bg-white shadow-lg border-2 border-primary-500' 
                  : 'bg-white/50 hover:bg-white border border-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${report.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold text-sm ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>
                {report.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{report.description}</p>
            </motion.button>
          )
        })}
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* FINANCIAL SUMMARY REPORT */}
          {activeReport === 'financial' && financialData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Income vs Expenses Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Income Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">Income</span>
                  </div>
                  <p className="text-3xl font-bold">{formatCurrency(financialData.income?.total)}</p>
                  <p className="text-emerald-100 text-sm mt-1">
                    {financialData.summary?.totalEggs?.toLocaleString()} eggs sold
                  </p>
                  <p className="text-emerald-100 text-sm">
                    {financialData.summary?.totalTrays} trays
                  </p>
                </div>

                {/* Expenses Card */}
                <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <TrendingDown className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">Expenses</span>
                  </div>
                  <p className="text-3xl font-bold">{formatCurrency(financialData.expenses?.total)}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-100">Feed:</span>
                      <span>{formatCurrency(financialData.expenses?.feed)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-100">Medicine:</span>
                      <span>{formatCurrency(financialData.expenses?.medicine)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Profit Card */}
                <div className={`bg-gradient-to-br ${financialData.profit?.isProfitable ? 'from-blue-500 to-indigo-600' : 'from-gray-500 to-gray-600'} rounded-2xl p-6 text-white shadow-lg`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 ${financialData.profit?.isProfitable ? 'bg-emerald-500' : 'bg-red-500'} rounded-full text-sm font-medium`}>
                      {financialData.profit?.isProfitable ? 'PROFIT' : 'LOSS'}
                    </span>
                  </div>
                  <p className="text-3xl font-bold">{formatCurrency(financialData.profit?.netIncome)}</p>
                  <p className="text-white/80 text-sm mt-1">
                    Profit Margin: {financialData.profit?.profitMargin}%
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-500" />
                  Financial Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Income Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Income Sources</h4>
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                      <span className="text-gray-700">Egg Sales</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(financialData.income?.eggSales)}</span>
                    </div>
                  </div>
                  
                  {/* Expense Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Expense Breakdown</h4>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Feed Consumption</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(financialData.expenses?.feed)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-violet-50 rounded-lg">
                      <span className="text-gray-700">Medicine Usage</span>
                      <span className="font-semibold text-violet-600">{formatCurrency(financialData.expenses?.medicine)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* EGG PRODUCTION + REVENUE REPORT */}
          {activeReport === 'egg-production' && eggProduction && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Egg Revenue Cards by Size */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { key: 'small', label: 'Small', color: 'from-blue-400 to-blue-500', price: eggPrices?.small },
                  { key: 'medium', label: 'Medium', color: 'from-green-400 to-green-500', price: eggPrices?.medium },
                  { key: 'large', label: 'Large', color: 'from-amber-400 to-amber-500', price: eggPrices?.large },
                  { key: 'xl', label: 'XL', color: 'from-orange-400 to-orange-500', price: eggPrices?.xl },
                  { key: 'jumbo', label: 'Jumbo', color: 'from-red-400 to-red-500', price: eggPrices?.jumbo }
                ].map((size) => {
                  const count = eggProduction.production?.[size.key] || 0
                  const revenue = eggProduction.revenue?.bySize?.[size.key] || 0
                  const trays = Math.floor(count / 30)
                  const loose = count % 30
                  
                  return (
                    <motion.div 
                      key={size.key}
                      whileHover={{ y: -3 }}
                      className={`bg-gradient-to-br ${size.color} rounded-2xl p-4 text-white shadow-lg`}
                    >
                      <p className="text-xs font-medium opacity-90 uppercase">{size.label} Eggs</p>
                      <p className="text-2xl font-bold mt-1">{count.toLocaleString()}</p>
                      <p className="text-xs opacity-80">eggs total</p>
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <p className="text-sm font-semibold">{formatCurrency(revenue)}</p>
                        <p className="text-xs opacity-80">{trays} trays + {loose} pcs</p>
                      </div>
                      <p className="text-xs mt-1 opacity-70">₱{size.price || 0}/tray</p>
                    </motion.div>
                  )
                })}
              </div>

              {/* Production Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Egg className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{eggProduction.production?.total?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Total Eggs</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{eggProduction.production?.broken?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Broken/Lost</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {Math.floor((eggProduction.production?.good || 0) / 30).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Total Trays</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{formatCurrency(eggProduction.revenue?.total)}</p>
                      <p className="text-xs text-gray-500">Total Revenue</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Egg Price Settings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Current Egg Prices (Per Tray of 30 eggs)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { key: 'small', label: 'Small' },
                    { key: 'medium', label: 'Medium' },
                    { key: 'large', label: 'Large' },
                    { key: 'xl', label: 'XL' },
                    { key: 'jumbo', label: 'Jumbo' }
                  ].map((size) => (
                    <div key={size.key} className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">{size.label}</p>
                      <p className="text-xl font-bold text-gray-800">₱{eggPrices?.[size.key] || 0}</p>
                      <p className="text-xs text-gray-400">per tray</p>
                      <p className="text-xs text-gray-400">₱{eggPrices?.[`${size.key}PerPiece`] || 0}/pc</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  * Prices can be updated in Settings. Revenue is calculated: full trays + loose eggs sold separately.
                </p>
              </div>
            </motion.div>
          )}

          {/* MORTALITY REPORT */}
          {activeReport === 'mortality' && mortalityData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-gray-800">{mortalityData.summary?.totalBatches}</p>
                  <p className="text-sm text-gray-500">Total Batches</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-gray-800">{mortalityData.summary?.totalInitial?.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Initial Chickens</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-red-600">{mortalityData.summary?.totalMortality?.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Mortality</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-amber-600">{mortalityData.summary?.overallMortalityRate}%</p>
                  <p className="text-sm text-gray-500">Overall Mortality Rate</p>
                </div>
              </div>

              {/* Batches Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Batch Mortality Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Batch ID</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Breed</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Initial</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Current</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Mortality</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Rate</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {mortalityData.batches?.map((batch) => (
                        <tr key={batch.batchId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{batch.batchId}</td>
                          <td className="px-4 py-3 text-gray-600">{batch.breed}</td>
                          <td className="px-4 py-3 text-center text-gray-800">{batch.initialQuantity?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center text-emerald-600 font-medium">{batch.currentCount?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center text-red-600">{batch.mortalityCount?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              batch.mortalityRate < 5 ? 'bg-emerald-100 text-emerald-700' :
                              batch.mortalityRate < 10 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {batch.mortalityRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              batch.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {batch.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* FEED COSTS REPORT */}
          {activeReport === 'feed-costs' && feedCosts && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(feedCosts.summary?.totalCost)}</p>
                  <p className="text-sm text-gray-500">Total Feed Cost</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-gray-800">{feedCosts.summary?.totalQuantity?.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">Total kg Used</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(feedCosts.summary?.averageCostPerKg)}</p>
                  <p className="text-sm text-gray-500">Avg Cost per kg</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-gray-800">{feedCosts.summary?.recordCount}</p>
                  <p className="text-sm text-gray-500">Feed Records</p>
                </div>
              </div>

              {/* FEED STOCK INVENTORY */}
              {feedCosts.feedInventory && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-500" />
                      Current Feed Stock Inventory
                    </h3>
                    <span className="text-sm text-gray-500">
                      {Object.keys(feedCosts.feedInventory).length} feed types
                    </span>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(feedCosts.feedInventory).map(([feedName, data]) => (
                      <div key={feedName} className={`p-4 rounded-xl border ${data.isLowStock ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{feedName}</p>
                            <p className="text-xs text-gray-500">{data.brand} • {data.type}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${data.isLowStock ? 'text-red-600' : 'text-emerald-600'}`}>
                              {data.currentStock.toFixed(1)} {data.unit}
                            </p>
                            <p className="text-xs text-gray-500">current stock</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200">
                          <div>
                            <p className="text-xs text-gray-500">This Month Used</p>
                            <p className="font-semibold text-gray-800">{data.thisMonth?.used?.toFixed(1) || 0} {data.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">This Month Bought</p>
                            <p className="font-semibold text-emerald-600">{data.thisMonth?.purchased?.toFixed(1) || 0} {data.unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Last Month Used</p>
                            <p className="font-semibold text-gray-800">{data.lastMonth?.used?.toFixed(1) || 0} {data.unit}</p>
                          </div>
                        </div>
                        {data.isLowStock && (
                          <div className="mt-3 p-2 bg-red-100 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <p className="text-sm text-red-700">
                              Low stock! Need {data.deficit?.toFixed(1)} {data.unit} more (below {data.lowStockThreshold} {data.unit} threshold)
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost by Feed Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Costs by Feed Type</h3>
                  <div className="space-y-3">
                    {feedCosts.byFeed && Object.entries(feedCosts.byFeed).map(([feed, data]) => (
                      <div key={feed} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{feed}</p>
                          <p className="text-xs text-gray-500">{data.quantity?.toFixed(1)} kg • {data.count} times</p>
                        </div>
                        <span className="font-semibold text-blue-600">{formatCurrency(data.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Costs by Batch</h3>
                  <div className="space-y-3">
                    {feedCosts.byBatch && Object.entries(feedCosts.byBatch).map(([batch, data]) => (
                      <div key={batch} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{batch}</p>
                          <p className="text-xs text-gray-500">{data.breed}</p>
                          <p className="text-xs text-gray-500">{data.quantity?.toFixed(1)} kg consumed</p>
                        </div>
                        <span className="font-semibold text-amber-600">{formatCurrency(data.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MEDICINE COSTS REPORT */}
          {activeReport === 'medicine-costs' && medicineCosts && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-violet-600">{formatCurrency(medicineCosts.summary?.totalCost)}</p>
                  <p className="text-sm text-gray-500">Total Medicine Cost</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-gray-800">{medicineCosts.summary?.totalQuantity?.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Units Used</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-3xl font-bold text-gray-800">{medicineCosts.summary?.recordCount}</p>
                  <p className="text-sm text-gray-500">Applications</p>
                </div>
              </div>

              {/* Costs by Medicine */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Costs by Medicine</h3>
                  <div className="space-y-3">
                    {medicineCosts.byMedicine && Object.entries(medicineCosts.byMedicine).map(([medicine, data]) => (
                      <div key={medicine} className="flex justify-between items-center p-3 bg-violet-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{medicine}</p>
                          <p className="text-xs text-gray-500">{data.type} • {data.quantity} {data.quantity === 1 ? 'unit' : 'units'}</p>
                        </div>
                        <span className="font-semibold text-violet-600">{formatCurrency(data.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Costs by Batch</h3>
                  <div className="space-y-3">
                    {medicineCosts.byBatch && Object.entries(medicineCosts.byBatch).map(([batch, data]) => (
                      <div key={batch} className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{batch}</p>
                          <p className="text-xs text-gray-500">{data.breed}</p>
                          <p className="text-xs text-gray-500">{data.quantity} units used</p>
                        </div>
                        <span className="font-semibold text-pink-600">{formatCurrency(data.cost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}

export default Reports

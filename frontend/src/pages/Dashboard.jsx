import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Bird, 
  Egg, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Calendar,
  ArrowUp,
  ArrowDown,
  Skull
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { batchAPI, eggAPI, feedAPI } from '../services/api'

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

// Quick Action Button
function QuickAction({ icon: Icon, label, onClick, color }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white font-medium shadow-lg transition-shadow hover:shadow-xl ${color}`}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalChickens: 0,
    totalBatches: 0,
    activeBatches: 0,
    mortalityRate: 0,
    eggsToday: 0,
    eggTrend: []
  })
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load batch stats
      const batchRes = await batchAPI.getStats().catch(() => ({ data: {} }))
      
      // Load today's eggs
      const eggRes = await eggAPI.getToday().catch(() => ({ data: { total: 0 } }))
      
      // Load egg trends
      const trendRes = await eggAPI.getTrends().catch(() => ({ data: [] }))
      
      // Load feed alerts
      const feedRes = await feedAPI.getAlerts().catch(() => ({ data: [] }))
      
      setStats({
        totalChickens: batchRes.data.totalChickens || 0,
        totalBatches: batchRes.data.totalBatches || 0,
        activeBatches: batchRes.data.activeBatches || 0,
        totalMortality: batchRes.data.totalMortality || 0,
        mortalityRate: batchRes.data.mortalityRate || 0,
        eggsToday: eggRes.data.total || 0,
        eggTrend: trendRes.data || []
      })
      
      setAlerts(feedRes.data || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
        <QuickAction 
          icon={Plus} 
          label="Add Batch" 
          color="bg-primary-600 hover:bg-primary-700" 
          onClick={() => navigate('/chickens')}
        />
        <QuickAction 
          icon={Egg} 
          label="Record Eggs" 
          color="bg-accent-500 hover:bg-accent-600" 
          onClick={() => navigate('/eggs')}
        />
        <QuickAction 
          icon={Calendar} 
          label="Schedule" 
          color="bg-blue-500 hover:bg-blue-600" 
          onClick={() => navigate('/medicine')}
        />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Chickens"
          value={loading ? '...' : stats.totalChickens}
          subtitle={`${stats.activeBatches} active batches`}
          icon={Bird}
          color="bg-primary-500"
        />
        <StatCard
          title="Eggs Today"
          value={loading ? '...' : stats.eggsToday}
          subtitle="Across all batches"
          icon={Egg}
          trend="up"
          trendValue="12% vs yesterday"
          color="bg-accent-500"
        />
        <StatCard
          title="Total Deaths"
          value={loading ? '...' : stats.totalMortality}
          subtitle={`${stats.mortalityRate}% mortality rate`}
          icon={Skull}
          trend="down"
          trendValue="All time deaths"
          color="bg-red-600"
        />
        <StatCard
          title="Mortality Rate"
          value={loading ? '...' : `${stats.mortalityRate}%`}
          subtitle="Within normal range"
          icon={TrendingUp}
          trend="down"
          trendValue="0.5% this week"
          color="bg-red-500"
        />
        <StatCard
          title="Active Batches"
          value={loading ? '...' : stats.activeBatches}
          subtitle={`Total: ${stats.totalBatches} batches`}
          icon={Bird}
          color="bg-blue-500"
        />
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Egg Production Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Egg Production Trend</h3>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:border-primary-500">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
            </select>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.eggTrend.length > 0 ? stats.eggTrend : [
                { date: 'Day 1', total: 120, good: 115 },
                { date: 'Day 5', total: 135, good: 130 },
                { date: 'Day 10', total: 142, good: 138 },
                { date: 'Day 15', total: 128, good: 125 },
                { date: 'Day 20', total: 155, good: 150 },
                { date: 'Day 25', total: 168, good: 162 },
                { date: 'Day 30', total: 175, good: 170 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#eab308" 
                  strokeWidth={2}
                  dot={{ fill: '#eab308', strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="good" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Total Eggs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Good Eggs</span>
            </div>
          </div>
        </motion.div>

        {/* Activity Feed & Alerts */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Alerts */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-800">Alerts</h3>
            </div>
            
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert._id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Low Stock: {alert.name}</p>
                      <p className="text-xs text-amber-600">Only {alert.stock} {alert.unit} remaining</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm">
                No active alerts
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'batch' ? 'bg-primary-500' :
                    activity.type === 'egg' ? 'bg-accent-500' :
                    'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Dashboard

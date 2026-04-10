import express from 'express';
import EggRecord from '../models/EggRecord.js';
import EggPrice from '../models/EggPrice.js';
import Batch from '../models/Batch.js';
import FeedConsumption from '../models/FeedConsumption.js';
import Feed from '../models/Feed.js';
import MedicineSchedule from '../models/MedicineSchedule.js';
import Medicine from '../models/Medicine.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get egg production report with revenue
router.get('/egg-production', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, batchId } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (batchId) {
      query.batchId = batchId;
    }
    
    // Get egg prices for the user
    const eggPrices = await EggPrice.getOrCreate(req.userId);
    
    // Get all egg records
    const eggRecords = await EggRecord.find(query)
      .populate('batchId', 'batchId breed')
      .sort({ date: -1 });
    
    // Calculate production and revenue
    let totalProduction = {
      total: 0,
      broken: 0,
      good: 0,
      small: 0,
      medium: 0,
      large: 0,
      xl: 0,
      jumbo: 0
    };
    
    let totalRevenue = 0;
    let revenueBySize = { small: 0, medium: 0, large: 0, xl: 0, jumbo: 0 };
    const recordsWithRevenue = [];
    
    eggRecords.forEach(record => {
      totalProduction.total += record.total;
      totalProduction.broken += record.broken || 0;
      totalProduction.good += (record.total - (record.broken || 0));
      totalProduction.small += record.small || 0;
      totalProduction.medium += record.medium || 0;
      totalProduction.large += record.large || 0;
      totalProduction.xl += record.xl || 0;
      totalProduction.jumbo += record.jumbo || 0;
      
      const revenue = eggPrices.calculateRevenue(record);
      totalRevenue += revenue.total;
      revenueBySize.small += revenue.small;
      revenueBySize.medium += revenue.medium;
      revenueBySize.large += revenue.large;
      revenueBySize.xl += revenue.xl;
      revenueBySize.jumbo += revenue.jumbo;
      
      recordsWithRevenue.push({
        ...record.toObject(),
        revenue
      });
    });
    
    res.json({
      production: totalProduction,
      revenue: {
        total: totalRevenue,
        bySize: revenueBySize
      },
      records: recordsWithRevenue,
      eggPrices: eggPrices
    });
  } catch (error) {
    console.error('Error generating egg production report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Get mortality report
router.get('/mortality', authMiddleware, async (req, res) => {
  try {
    const batches = await Batch.find();
    
    const mortalityReport = batches.map(batch => {
      const currentCount = batch.quantity - (batch.mortalityCount || 0) - (batch.soldCount || 0);
      const mortalityRate = batch.quantity > 0 
        ? ((batch.mortalityCount || 0) / batch.quantity * 100).toFixed(2)
        : 0;
      
      return {
        batchId: batch.batchId,
        breed: batch.breed,
        initialQuantity: batch.quantity,
        currentCount,
        mortalityCount: batch.mortalityCount || 0,
        soldCount: batch.soldCount || 0,
        mortalityRate: parseFloat(mortalityRate),
        status: currentCount > 0 ? 'Active' : 'Ended',
        entryDate: batch.entryDate,
        age: batch.getAge ? batch.getAge() : null
      };
    });
    
    const totalMortality = mortalityReport.reduce((sum, b) => sum + b.mortalityCount, 0);
    const totalInitial = mortalityReport.reduce((sum, b) => sum + b.initialQuantity, 0);
    const overallMortalityRate = totalInitial > 0 ? (totalMortality / totalInitial * 100).toFixed(2) : 0;
    
    res.json({
      batches: mortalityReport,
      summary: {
        totalBatches: batches.length,
        totalMortality,
        totalInitial,
        overallMortalityRate: parseFloat(overallMortalityRate)
      }
    });
  } catch (error) {
    console.error('Error generating mortality report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Get feed cost report with inventory tracking
router.get('/feed-costs', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const consumption = await FeedConsumption.find(query)
      .populate('feedId', 'name type brand stock unit costPerUnit lowStockThreshold supplier')
      .populate('batchId', 'batchId breed')
      .sort({ date: -1 });
    
    let totalCost = 0;
    let totalQuantity = 0;
    const byFeed = {};
    const byBatch = {};
    
    // Feed inventory data with this/last month tracking
    const feedInventory = {};
    
    // Date ranges for this month and last month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    consumption.forEach(record => {
      const cost = record.cost || 0;
      totalCost += cost;
      totalQuantity += record.quantity || 0;
      
      // Group by feed
      const feedId = record.feedId?._id?.toString();
      const feedName = record.feedId?.name || 'Unknown';
      
      if (!byFeed[feedName]) {
        byFeed[feedName] = { quantity: 0, cost: 0, count: 0 };
      }
      byFeed[feedName].quantity += record.quantity || 0;
      byFeed[feedName].cost += cost;
      byFeed[feedName].count++;
      
      // Build inventory data
      if (feedId && !feedInventory[feedName]) {
        feedInventory[feedName] = {
          id: feedId,
          brand: record.feedId?.brand || 'N/A',
          type: record.feedId?.type || 'N/A',
          currentStock: record.feedId?.stock || 0,
          unit: record.feedId?.unit || 'kg',
          costPerUnit: record.feedId?.costPerUnit || 0,
          lowStockThreshold: record.feedId?.lowStockThreshold || 10,
          supplier: record.feedId?.supplier || 'N/A',
          thisMonth: { used: 0, purchased: 0 },
          lastMonth: { used: 0, purchased: 0 },
          isLowStock: false,
          deficit: 0
        };
      }
      
      // Track usage by month
      if (feedInventory[feedName]) {
        const recordDate = new Date(record.date);
        const qty = record.quantity || 0;
        
        if (recordDate >= thisMonthStart) {
          feedInventory[feedName].thisMonth.used += qty;
        } else if (recordDate >= lastMonthStart && recordDate <= lastMonthEnd) {
          feedInventory[feedName].lastMonth.used += qty;
        }
      }
      
      // Group by batch
      const batchId = record.batchId?.batchId || 'Unknown';
      if (!byBatch[batchId]) {
        byBatch[batchId] = { 
          breed: record.batchId?.breed,
          quantity: 0, 
          cost: 0 
        };
      }
      byBatch[batchId].quantity += record.quantity || 0;
      byBatch[batchId].cost += cost;
    });
    
    // Check for low stock
    Object.keys(feedInventory).forEach(feedName => {
      const feed = feedInventory[feedName];
      feed.isLowStock = feed.currentStock < feed.lowStockThreshold;
      if (feed.isLowStock) {
        feed.deficit = feed.lowStockThreshold - feed.currentStock;
      }
    });
    
    res.json({
      summary: {
        totalCost,
        totalQuantity,
        recordCount: consumption.length,
        averageCostPerKg: totalQuantity > 0 ? totalCost / totalQuantity : 0
      },
      byFeed,
      byBatch,
      feedInventory,
      records: consumption
    });
  } catch (error) {
    console.error('Error generating feed cost report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Get medicine usage report
router.get('/medicine-costs', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { status: 'completed' };
    if (startDate && endDate) {
      query.administeredDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    const schedules = await MedicineSchedule.find(query)
      .populate('medicineId', 'name type costPerUnit')
      .populate('batchId', 'batchId breed')
      .sort({ administeredDate: -1 });
    
    let totalCost = 0;
    let totalQuantity = 0;
    const byMedicine = {};
    const byBatch = {};
    
    schedules.forEach(schedule => {
      const quantity = schedule.quantity || 0;
      const costPerUnit = schedule.medicineId?.costPerUnit || 0;
      const totalMedicineCost = quantity * costPerUnit;
      
      totalCost += totalMedicineCost;
      totalQuantity += quantity;
      
      // Group by medicine
      const medName = schedule.medicineId?.name || 'Unknown';
      if (!byMedicine[medName]) {
        byMedicine[medName] = { 
          quantity: 0, 
          cost: 0,
          type: schedule.medicineId?.type 
        };
      }
      byMedicine[medName].quantity += quantity;
      byMedicine[medName].cost += totalMedicineCost;
      
      // Group by batch
      const batchId = schedule.batchId?.batchId || 'Unknown';
      if (!byBatch[batchId]) {
        byBatch[batchId] = {
          breed: schedule.batchId?.breed,
          quantity: 0,
          cost: 0
        };
      }
      byBatch[batchId].quantity += quantity;
      byBatch[batchId].cost += totalMedicineCost;
    });
    
    res.json({
      summary: {
        totalCost,
        totalQuantity,
        recordCount: schedules.length
      },
      byMedicine,
      byBatch,
      records: schedules
    });
  } catch (error) {
    console.error('Error generating medicine cost report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Get comprehensive financial summary
router.get('/financial-summary', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get egg prices
    const eggPrices = await EggPrice.getOrCreate(req.userId);
    
    // Get egg records for revenue
    let eggQuery = {};
    let feedQuery = {};
    let medicineQuery = { status: 'completed' };
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      eggQuery.date = { $gte: start, $lte: end };
      feedQuery.date = { $gte: start, $lte: end };
      medicineQuery.administeredDate = { $gte: start, $lte: end };
    }
    
    // Calculate egg revenue
    const eggRecords = await EggRecord.find(eggQuery);
    let eggRevenue = 0;
    eggRecords.forEach(record => {
      const revenue = eggPrices.calculateRevenue(record);
      eggRevenue += revenue.total;
    });
    
    // Calculate feed costs
    const feedConsumption = await FeedConsumption.find(feedQuery);
    let feedCost = 0;
    feedConsumption.forEach(record => {
      feedCost += record.cost || 0;
    });
    
    // Calculate medicine costs
    const medicineSchedules = await MedicineSchedule.find(medicineQuery).populate('medicineId', 'costPerUnit');
    let medicineCost = 0;
    medicineSchedules.forEach(schedule => {
      const costPerUnit = schedule.medicineId?.costPerUnit || 0;
      medicineCost += (schedule.quantity || 0) * costPerUnit;
    });
    
    // Calculate totals
    const totalExpenses = feedCost + medicineCost;
    const netIncome = eggRevenue - totalExpenses;
    const profitMargin = eggRevenue > 0 ? (netIncome / eggRevenue * 100).toFixed(2) : 0;
    
    res.json({
      income: {
        eggSales: eggRevenue,
        total: eggRevenue
      },
      expenses: {
        feed: feedCost,
        medicine: medicineCost,
        total: totalExpenses
      },
      profit: {
        netIncome,
        profitMargin: parseFloat(profitMargin),
        isProfitable: netIncome > 0
      },
      summary: {
        totalEggs: eggRecords.reduce((sum, r) => sum + r.total, 0),
        totalTrays: Math.floor(eggRecords.reduce((sum, r) => sum + r.total, 0) / 30),
        feedConsumptions: feedConsumption.length,
        medicineApplications: medicineSchedules.length
      }
    });
  } catch (error) {
    console.error('Error generating financial summary:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Update egg prices
router.put('/egg-prices', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const eggPrices = await EggPrice.getOrCreate(req.userId);
    
    Object.keys(updates).forEach(key => {
      if (eggPrices[key] !== undefined) {
        eggPrices[key] = updates[key];
      }
    });
    
    eggPrices.updatedAt = new Date();
    await eggPrices.save();
    
    res.json({ message: 'Egg prices updated successfully', eggPrices });
  } catch (error) {
    console.error('Error updating egg prices:', error);
    res.status(500).json({ message: 'Error updating egg prices', error: error.message });
  }
});

// Get current egg prices
router.get('/egg-prices', authMiddleware, async (req, res) => {
  try {
    const eggPrices = await EggPrice.getOrCreate(req.userId);
    res.json(eggPrices);
  } catch (error) {
    console.error('Error fetching egg prices:', error);
    res.status(500).json({ message: 'Error fetching egg prices', error: error.message });
  }
});

export default router;

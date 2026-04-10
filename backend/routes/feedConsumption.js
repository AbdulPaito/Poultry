import express from 'express';
import FeedConsumption from '../models/FeedConsumption.js';
import Feed from '../models/Feed.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Record new feed consumption
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { feedId, batchId, quantity, unit, cost, date, notes } = req.body;
    
    // Validate required fields
    if (!feedId || !batchId || !quantity) {
      return res.status(400).json({ message: 'feedId, batchId, and quantity are required' });
    }
    
    // Get the feed to check stock and unit
    const feed = await Feed.findById(feedId);
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }
    
    // Check if enough stock is available
    if (feed.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }
    
    // Create consumption record
    const consumption = new FeedConsumption({
      feedId,
      batchId,
      quantity: parseFloat(quantity),
      unit: unit || feed.unit,
      cost: cost || (quantity * feed.costPerUnit),
      date: date || new Date(),
      notes,
      recordedBy: req.userId
    });
    
    await consumption.save();
    
    // Update feed stock
    feed.stock -= parseFloat(quantity);
    feed.updatedAt = new Date();
    await feed.save();
    
    res.status(201).json({
      message: 'Feed consumption recorded successfully',
      consumption,
      updatedStock: feed.stock
    });
  } catch (error) {
    console.error('Error recording feed consumption:', error);
    res.status(500).json({ message: 'Error recording feed consumption', error: error.message });
  }
});

// Get all consumption records (with optional filters)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { feedId, batchId, startDate, endDate, limit = 50 } = req.query;
    
    let query = {};
    
    if (feedId) query.feedId = feedId;
    if (batchId) query.batchId = batchId;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const records = await FeedConsumption.find(query)
      .populate('feedId', 'name unit costPerUnit')
      .populate('batchId', 'batchId breed')
      .populate('recordedBy', 'username')
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching feed consumption:', error);
    res.status(500).json({ message: 'Error fetching feed consumption records', error: error.message });
  }
});

// Get today's usage
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const records = await FeedConsumption.getTodayUsage(today);
    
    // Calculate totals
    const totalUsage = records.reduce((sum, r) => sum + r.quantity, 0);
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
    
    res.json({
      date: today,
      records,
      summary: {
        totalRecords: records.length,
        totalQuantity: totalUsage,
        totalCost
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s usage:', error);
    res.status(500).json({ message: 'Error fetching today\'s usage', error: error.message });
  }
});

// Get daily usage for a specific feed
router.get('/daily/:feedId', authMiddleware, async (req, res) => {
  try {
    const { feedId } = req.params;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    const usage = await FeedConsumption.getDailyUsage(feedId, targetDate);
    
    res.json({
      feedId,
      date: targetDate,
      ...usage
    });
  } catch (error) {
    console.error('Error fetching daily usage:', error);
    res.status(500).json({ message: 'Error fetching daily usage', error: error.message });
  }
});

// Get usage summary for date range
router.get('/summary/range', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }
    
    const summary = await FeedConsumption.getUsageSummary(startDate, endDate);
    
    res.json({
      startDate,
      endDate,
      summary
    });
  } catch (error) {
    console.error('Error fetching usage summary:', error);
    res.status(500).json({ message: 'Error fetching usage summary', error: error.message });
  }
});

// Get consumption by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const consumption = await FeedConsumption.findById(req.params.id)
      .populate('feedId', 'name unit costPerUnit')
      .populate('batchId', 'batchId breed')
      .populate('recordedBy', 'username');
    
    if (!consumption) {
      return res.status(404).json({ message: 'Consumption record not found' });
    }
    
    res.json(consumption);
  } catch (error) {
    console.error('Error fetching consumption record:', error);
    res.status(500).json({ message: 'Error fetching consumption record', error: error.message });
  }
});

// Update consumption record
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    
    const consumption = await FeedConsumption.findById(req.params.id);
    if (!consumption) {
      return res.status(404).json({ message: 'Consumption record not found' });
    }
    
    // If quantity changed, update feed stock
    if (quantity && quantity !== consumption.quantity) {
      const feed = await Feed.findById(consumption.feedId);
      if (feed) {
        // Revert old quantity and apply new
        feed.stock += consumption.quantity - quantity;
        await feed.save();
      }
      consumption.quantity = quantity;
    }
    
    if (notes) consumption.notes = notes;
    
    await consumption.save();
    
    res.json({
      message: 'Consumption record updated successfully',
      consumption
    });
  } catch (error) {
    console.error('Error updating consumption:', error);
    res.status(500).json({ message: 'Error updating consumption record', error: error.message });
  }
});

// Delete consumption record
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const consumption = await FeedConsumption.findById(req.params.id);
    if (!consumption) {
      return res.status(404).json({ message: 'Consumption record not found' });
    }
    
    // Restore feed stock
    const feed = await Feed.findById(consumption.feedId);
    if (feed) {
      feed.stock += consumption.quantity;
      await feed.save();
    }
    
    await FeedConsumption.findByIdAndDelete(req.params.id);
    
    res.json({
      message: 'Consumption record deleted and stock restored',
      restoredStock: consumption.quantity
    });
  } catch (error) {
    console.error('Error deleting consumption:', error);
    res.status(500).json({ message: 'Error deleting consumption record', error: error.message });
  }
});

export default router;

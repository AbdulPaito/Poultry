import express from 'express';
import EggRecord from '../models/EggRecord.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all egg records
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { batchId, startDate, endDate } = req.query;
    let query = { recordedBy: req.userId };
    
    if (batchId) query.batchId = batchId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const records = await EggRecord.find(query)
      .populate('batchId', 'batchId breed')
      .sort({ date: -1 });
      
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get today's egg count
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const records = await EggRecord.find({
      recordedBy: req.userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    const total = records.reduce((sum, r) => sum + r.total, 0);
    const goodEggs = records.reduce((sum, r) => sum + r.getGoodEggs(), 0);
    
    res.json({ total, goodEggs, count: records.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get egg trends (last 30 days)
router.get('/trends/daily', authMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const records = await EggRecord.find({
      recordedBy: req.userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });
    
    // Group by date
    const dailyData = {};
    records.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, total: 0, good: 0, broken: 0 };
      }
      dailyData[dateKey].total += record.total;
      dailyData[dateKey].good += record.getGoodEggs();
      dailyData[dateKey].broken += record.broken;
    });
    
    res.json(Object.values(dailyData));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create egg record
router.post('/', authMiddleware, async (req, res) => {
  try {
    const record = new EggRecord({
      ...req.body,
      recordedBy: req.userId
    });
    
    await record.save();
    await record.populate('batchId', 'batchId breed');
    
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update egg record
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await EggRecord.findOneAndUpdate(
      { _id: req.params.id, recordedBy: req.userId },
      req.body,
      { new: true }
    ).populate('batchId', 'batchId breed');
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete egg record
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await EggRecord.findOneAndDelete({
      _id: req.params.id,
      recordedBy: req.userId
    });
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

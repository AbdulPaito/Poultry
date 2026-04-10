import express from 'express';
import Batch from '../models/Batch.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all batches
router.get('/', authMiddleware, async (req, res) => {
  try {
    const batches = await Batch.find({ createdBy: req.userId })
      .sort({ createdAt: -1 });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single batch
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      createdBy: req.userId
    });
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create batch
router.post('/', authMiddleware, async (req, res) => {
  try {
    const batch = new Batch({
      ...req.body,
      createdBy: req.userId
    });
    
    await batch.save();
    res.status(201).json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update batch
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const batch = await Batch.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    res.json(batch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete batch
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const batch = await Batch.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId
    });
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get batch statistics
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const batches = await Batch.find({ createdBy: req.userId });
    
    const totalChickens = batches.reduce((sum, b) => sum + b.getCurrentQuantity(), 0);
    const totalBatches = batches.length;
    const activeBatches = batches.filter(b => b.status === 'active').length;
    const totalMortality = batches.reduce((sum, b) => sum + b.mortalityCount, 0);
    
    const mortalityRate = totalChickens + totalMortality > 0
      ? ((totalMortality / (totalChickens + totalMortality)) * 100).toFixed(2)
      : 0;
    
    res.json({
      totalChickens,
      totalBatches,
      activeBatches,
      totalMortality,
      mortalityRate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

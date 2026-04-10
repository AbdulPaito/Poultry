import express from 'express';
import Feed from '../models/Feed.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all feeds
router.get('/', authMiddleware, async (req, res) => {
  try {
    const feeds = await Feed.find({ createdBy: req.userId })
      .sort({ createdAt: -1 });
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', authMiddleware, async (req, res) => {
  try {
    const feeds = await Feed.find({ createdBy: req.userId });
    const lowStock = feeds.filter(f => f.isLowStock());
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create feed
router.post('/', authMiddleware, async (req, res) => {
  try {
    const feed = new Feed({
      ...req.body,
      createdBy: req.userId
    });
    
    await feed.save();
    res.status(201).json(feed);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update feed
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const feed = await Feed.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }
    
    res.json(feed);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete feed
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const feed = await Feed.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId
    });
    
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }
    
    res.json({ message: 'Feed deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

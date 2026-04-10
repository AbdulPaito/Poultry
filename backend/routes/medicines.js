import express from 'express';
import Medicine from '../models/Medicine.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all medicines
router.get('/', authMiddleware, async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ message: 'Error fetching medicines', error: error.message });
  }
});

// Get medicine by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({ message: 'Error fetching medicine', error: error.message });
  }
});

// Create new medicine
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, type, stock, unit, costPerUnit, supplier, expiryDate, lowStockThreshold, notes } = req.body;
    
    const medicine = new Medicine({
      name,
      type,
      stock: stock || 0,
      unit,
      costPerUnit: costPerUnit || 0,
      supplier,
      expiryDate,
      lowStockThreshold: lowStockThreshold || 5,
      notes
    });
    
    await medicine.save();
    res.status(201).json({ message: 'Medicine created successfully', medicine });
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({ message: 'Error creating medicine', error: error.message });
  }
});

// Update medicine
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedAt = new Date();
    
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    res.json({ message: 'Medicine updated successfully', medicine });
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ message: 'Error updating medicine', error: error.message });
  }
});

// Delete medicine
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ message: 'Error deleting medicine', error: error.message });
  }
});

// Get alerts (low stock + expiring)
router.get('/alerts/all', authMiddleware, async (req, res) => {
  try {
    const lowStock = await Medicine.getLowStock();
    const expiring = await Medicine.getExpiringSoon();
    
    res.json({
      lowStock,
      expiring,
      totalAlerts: lowStock.length + expiring.length
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
});

// Get inventory stats
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const totalValue = await Medicine.getTotalValue();
    const medicines = await Medicine.find();
    
    const expiringSoon = medicines.filter(m => m.status === 'expiring-soon').length;
    const lowStock = medicines.filter(m => m.status === 'low-stock').length;
    const expired = medicines.filter(m => m.status === 'expired').length;
    
    res.json({
      totalItems: medicines.length,
      totalValue,
      expiringSoon,
      lowStock,
      expired,
      good: medicines.length - expiringSoon - lowStock - expired
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Restock medicine
router.post('/:id/restock', authMiddleware, async (req, res) => {
  try {
    const { quantity, costPerUnit } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }
    
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    medicine.stock += parseInt(quantity);
    if (costPerUnit) medicine.costPerUnit = costPerUnit;
    medicine.updatedAt = new Date();
    
    await medicine.save();
    
    res.json({
      message: 'Medicine restocked successfully',
      medicine,
      added: quantity,
      newStock: medicine.stock
    });
  } catch (error) {
    console.error('Error restocking medicine:', error);
    res.status(500).json({ message: 'Error restocking medicine', error: error.message });
  }
});

export default router;

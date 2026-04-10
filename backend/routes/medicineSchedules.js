import express from 'express';
import MedicineSchedule from '../models/MedicineSchedule.js';
import Medicine from '../models/Medicine.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all schedules
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, batchId, medicineId } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (batchId) query.batchId = batchId;
    if (medicineId) query.medicineId = medicineId;
    
    const schedules = await MedicineSchedule.find(query)
      .populate('medicineId', 'name type unit stock')
      .populate('batchId', 'batchId breed')
      .populate('createdBy', 'username')
      .sort({ scheduledDate: -1 });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Error fetching schedules', error: error.message });
  }
});

// Get today's schedules
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const schedules = await MedicineSchedule.getTodaySchedules();
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching today\'s schedules:', error);
    res.status(500).json({ message: 'Error fetching today\'s schedules', error: error.message });
  }
});

// Get pending schedules
router.get('/status/pending', authMiddleware, async (req, res) => {
  try {
    const schedules = await MedicineSchedule.getPending();
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching pending schedules:', error);
    res.status(500).json({ message: 'Error fetching pending schedules', error: error.message });
  }
});

// Create new schedule
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { medicineId, batchId, scheduledDate, quantity, dosage, notes } = req.body;
    
    // Check medicine stock
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    if (medicine.stock < (quantity || 1)) {
      return res.status(400).json({ message: 'Insufficient medicine stock' });
    }
    
    const schedule = new MedicineSchedule({
      medicineId,
      batchId,
      scheduledDate,
      quantity: quantity || 1,
      dosage,
      notes,
      createdBy: req.userId
    });
    
    await schedule.save();
    
    // Deduct from stock
    medicine.stock -= (quantity || 1);
    await medicine.save();
    
    res.status(201).json({
      message: 'Schedule created successfully',
      schedule: await schedule.populate('medicineId batchId')
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Error creating schedule', error: error.message });
  }
});

// Complete a schedule (administer medicine)
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const schedule = await MedicineSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    if (schedule.status === 'completed') {
      return res.status(400).json({ message: 'Schedule already completed' });
    }
    
    await schedule.complete(req.userId, notes);
    
    res.json({
      message: 'Medicine administered successfully',
      schedule: await schedule.populate('medicineId batchId administeredBy')
    });
  } catch (error) {
    console.error('Error completing schedule:', error);
    res.status(500).json({ message: 'Error completing schedule', error: error.message });
  }
});

// Cancel schedule
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const schedule = await MedicineSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    if (schedule.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending schedules' });
    }
    
    // Restore medicine stock
    const medicine = await Medicine.findById(schedule.medicineId);
    if (medicine) {
      medicine.stock += schedule.quantity;
      await medicine.save();
    }
    
    schedule.status = 'cancelled';
    await schedule.save();
    
    res.json({ message: 'Schedule cancelled and stock restored', schedule });
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    res.status(500).json({ message: 'Error cancelling schedule', error: error.message });
  }
});

// Update schedule
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.status; // Don't allow status update through PUT
    delete updates.createdBy;
    
    const schedule = await MedicineSchedule.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('medicineId batchId');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    res.json({ message: 'Schedule updated successfully', schedule });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: 'Error updating schedule', error: error.message });
  }
});

// Delete schedule
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const schedule = await MedicineSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    // Restore stock if pending
    if (schedule.status === 'pending') {
      const medicine = await Medicine.findById(schedule.medicineId);
      if (medicine) {
        medicine.stock += schedule.quantity;
        await medicine.save();
      }
    }
    
    await MedicineSchedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Error deleting schedule', error: error.message });
  }
});

// Get schedule history (completed)
router.get('/history/completed', authMiddleware, async (req, res) => {
  try {
    const schedules = await MedicineSchedule.find({ status: 'completed' })
      .populate('medicineId', 'name type unit')
      .populate('batchId', 'batchId breed')
      .populate('administeredBy', 'username')
      .sort({ administeredDate: -1 });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
});

export default router;

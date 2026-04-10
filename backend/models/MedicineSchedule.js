import mongoose from 'mongoose';

const medicineScheduleSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0
  },
  dosage: {
    type: String,
    default: ''
  },
  administeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  administeredDate: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Get today's schedules
medicineScheduleSchema.statics.getTodaySchedules = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  return await this.find({
    scheduledDate: { $gte: today, $lt: tomorrow }
  }).populate('medicineId', 'name type unit').populate('batchId', 'batchId breed');
};

// Get pending schedules
medicineScheduleSchema.statics.getPending = async function() {
  return await this.find({ status: 'pending' })
    .populate('medicineId', 'name type unit')
    .populate('batchId', 'batchId breed')
    .sort({ scheduledDate: 1 });
};

// Complete a schedule
medicineScheduleSchema.methods.complete = async function(administeredBy, notes) {
  this.status = 'completed';
  this.administeredBy = administeredBy;
  this.administeredDate = new Date();
  if (notes) this.notes = notes;
  return await this.save();
};

export default mongoose.model('MedicineSchedule', medicineScheduleSchema);

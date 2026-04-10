import mongoose from 'mongoose';

const eggRecordSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  broken: {
    type: Number,
    default: 0,
    min: 0
  },
  small: {
    type: Number,
    default: 0,
    min: 0
  },
  medium: {
    type: Number,
    default: 0,
    min: 0
  },
  large: {
    type: Number,
    default: 0,
    min: 0
  },
  jumbo: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    default: ''
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate good eggs (total - broken)
eggRecordSchema.methods.getGoodEggs = function() {
  return this.total - this.broken;
};

// Index for faster queries
eggRecordSchema.index({ batchId: 1, date: -1 });

export default mongoose.model('EggRecord', eggRecordSchema);

import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    unique: true
  },
  breed: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  dateAcquired: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'retired'],
    default: 'active'
  },
  mortalityCount: {
    type: Number,
    default: 0,
    min: 0
  },
  mortalityRecords: [{
    count: { type: Number, required: true },
    date: { type: Date, required: true },
    reason: { type: String, default: '' },
    notes: { type: String, default: '' },
    id: { type: Number }
  }],
  soldCount: {
    type: Number,
    default: 0,
    min: 0
  },
  source: {
    type: String,
    default: ''
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate current age and remaining quantity
batchSchema.methods.getAgeInDays = function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.dateAcquired);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

batchSchema.methods.getCurrentQuantity = function() {
  return this.quantity - this.mortalityCount - this.soldCount;
};

export default mongoose.model('Batch', batchSchema);

import mongoose from 'mongoose';

const feedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['starter', 'grower', 'layer', 'breeder', 'medicine'],
    required: true
  },
  brand: {
    type: String,
    default: ''
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'grams', 'bags', 'sacks'],
    default: 'kg'
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  supplier: {
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

// Check if stock is low
feedSchema.methods.isLowStock = function() {
  return this.stock <= this.lowStockThreshold;
};

export default mongoose.model('Feed', feedSchema);

import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Antibiotic', 'Vitamin', 'Dewormer', 'Vaccine', 'Disinfectant', 'Supplement', 'Other'],
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    enum: ['bottles', 'packets', 'tablets', 'ml', 'grams', 'units', 'pieces'],
    default: 'pieces'
  },
  costPerUnit: {
    type: Number,
    default: 0
  },
  supplier: {
    type: String,
    default: ''
  },
  expiryDate: {
    type: Date
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  notes: {
    type: String,
    default: ''
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

// Virtual for status based on stock and expiry
medicineSchema.virtual('status').get(function() {
  const today = new Date();
  const expDate = new Date(this.expiryDate);
  const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  
  if (this.stock <= this.lowStockThreshold) return 'low-stock';
  if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) return 'expiring-soon';
  if (daysUntilExpiry <= 0) return 'expired';
  return 'good';
});

// Get medicines with low stock
medicineSchema.statics.getLowStock = async function() {
  return await this.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] }
  });
};

// Get expiring medicines (within 30 days)
medicineSchema.statics.getExpiringSoon = async function() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  return await this.find({
    expiryDate: { $gte: today, $lte: thirtyDaysFromNow }
  });
};

// Calculate total inventory value
medicineSchema.statics.getTotalValue = async function() {
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$stock', '$costPerUnit'] } }
      }
    }
  ]);
  return result[0]?.totalValue || 0;
};

export default mongoose.model('Medicine', medicineSchema);

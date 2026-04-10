import mongoose from 'mongoose';

const feedConsumptionSchema = new mongoose.Schema({
  feedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feed',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'grams', 'bags', 'sacks'],
    default: 'kg'
  },
  cost: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
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

// Index for faster queries by date and feed
feedConsumptionSchema.index({ feedId: 1, date: -1 });
feedConsumptionSchema.index({ batchId: 1, date: -1 });
feedConsumptionSchema.index({ date: -1 });

// Get daily usage for a specific feed
feedConsumptionSchema.statics.getDailyUsage = async function(feedId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const result = await this.aggregate([
    {
      $match: {
        feedId: new mongoose.Types.ObjectId(feedId),
        date: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantity' },
        totalCost: { $sum: '$cost' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || { totalQuantity: 0, totalCost: 0, count: 0 };
};

// Get all usage for today
feedConsumptionSchema.statics.getTodayUsage = async function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return await this.find({
    date: { $gte: startOfDay, $lte: endOfDay }
  }).populate('feedId', 'name unit').populate('batchId', 'batchId breed');
};

// Get total usage per feed with date range
feedConsumptionSchema.statics.getUsageSummary = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$feedId',
        totalQuantity: { $sum: '$quantity' },
        totalCost: { $sum: '$cost' },
        usageCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'feeds',
        localField: '_id',
        foreignField: '_id',
        as: 'feedInfo'
      }
    },
    {
      $unwind: '$feedInfo'
    },
    {
      $project: {
        feedName: '$feedInfo.name',
        unit: '$feedInfo.unit',
        totalQuantity: 1,
        totalCost: 1,
        usageCount: 1
      }
    }
  ]);
};

export default mongoose.model('FeedConsumption', feedConsumptionSchema);

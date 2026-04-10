import mongoose from 'mongoose';

const eggPriceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Prices per tray (30 eggs per tray)
  small: {
    type: Number,
    default: 150, // ₱150 per tray default
    min: 0
  },
  medium: {
    type: Number,
    default: 180,
    min: 0
  },
  large: {
    type: Number,
    default: 210,
    min: 0
  },
  xl: {
    type: Number,
    default: 240,
    min: 0
  },
  jumbo: {
    type: Number,
    default: 270,
    min: 0
  },
  // Prices per piece (optional)
  smallPerPiece: {
    type: Number,
    default: 5
  },
  mediumPerPiece: {
    type: Number,
    default: 6
  },
  largePerPiece: {
    type: Number,
    default: 7
  },
  xlPerPiece: {
    type: Number,
    default: 8
  },
  jumboPerPiece: {
    type: Number,
    default: 9
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Get or create egg prices for user
eggPriceSchema.statics.getOrCreate = async function(userId) {
  let prices = await this.findOne({ userId });
  if (!prices) {
    prices = new this({ userId });
    await prices.save();
  }
  return prices;
};

// Calculate revenue from egg record with proper per-piece pricing
eggPriceSchema.methods.calculateRevenue = function(eggRecord) {
  const eggsPerTray = 30;
  
  // Calculate trays (round down - partial tray sold as pieces)
  const smallTrays = Math.floor(eggRecord.small / eggsPerTray);
  const mediumTrays = Math.floor(eggRecord.medium / eggsPerTray);
  const largeTrays = Math.floor(eggRecord.large / eggsPerTray);
  const xlTrays = Math.floor((eggRecord.xl || 0) / eggsPerTray);
  const jumboTrays = Math.floor(eggRecord.jumbo / eggsPerTray);
  
  // Calculate loose eggs
  const smallLoose = eggRecord.small % eggsPerTray;
  const mediumLoose = eggRecord.medium % eggsPerTray;
  const largeLoose = eggRecord.large % eggsPerTray;
  const xlLoose = (eggRecord.xl || 0) % eggsPerTray;
  const jumboLoose = eggRecord.jumbo % eggsPerTray;
  
  // Calculate per-piece price as tray price / 30
  const smallPiecePrice = this.small / eggsPerTray;
  const mediumPiecePrice = this.medium / eggsPerTray;
  const largePiecePrice = this.large / eggsPerTray;
  const xlPiecePrice = this.xl / eggsPerTray;
  const jumboPiecePrice = this.jumbo / eggsPerTray;
  
  const revenue = {
    small: (smallTrays * this.small) + (smallLoose * smallPiecePrice),
    medium: (mediumTrays * this.medium) + (mediumLoose * mediumPiecePrice),
    large: (largeTrays * this.large) + (largeLoose * largePiecePrice),
    xl: (xlTrays * this.xl) + (xlLoose * xlPiecePrice),
    jumbo: (jumboTrays * this.jumbo) + (jumboLoose * jumboPiecePrice)
  };
  
  revenue.total = revenue.small + revenue.medium + revenue.large + revenue.xl + revenue.jumbo;
  
  return revenue;
};

export default mongoose.model('EggPrice', eggPriceSchema);

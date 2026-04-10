import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Batch from './models/Batch.js';
import EggRecord from './models/EggRecord.js';
import Feed from './models/Feed.js';

dotenv.config();

const clearData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!\n');

    console.log('Clearing all data...');
    await User.deleteMany({});
    console.log('✓ Users deleted');
    await Batch.deleteMany({});
    console.log('✓ Batches deleted');
    await EggRecord.deleteMany({});
    console.log('✓ Egg records deleted');
    await Feed.deleteMany({});
    console.log('✓ Feeds deleted');

    console.log('\n✅ ALL DATA CLEARED!');
    console.log('You can now sign up with a fresh account.');
    console.log('Go to http://localhost:3000 and click "Sign Up"');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

clearData();

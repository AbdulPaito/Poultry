import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Batch from './models/Batch.js';
import EggRecord from './models/EggRecord.js';
import Feed from './models/Feed.js';

dotenv.config();

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin account already exists!');
      console.log('\nLogin credentials:');
      console.log('Username: admin');
      console.log('Password: admin123');
      process.exit(0);
    }

    // 1. Create Admin User ONLY
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@poultry.com',
      fullName: 'System Administrator',
      farmName: 'Smart Poultry Farm',
      role: 'admin'
    });
    console.log('✓ Admin user created!');

    console.log('\n✅ SEED COMPLETE!');
    console.log('\n═══════════════════════════════════');
    console.log('      DEFAULT LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('═══════════════════════════════════');
    console.log('\nGo to http://localhost:3000 to login');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import batchRoutes from './routes/batches.js';
import eggRoutes from './routes/eggs.js';
import feedRoutes from './routes/feeds.js';
import feedConsumptionRoutes from './routes/feedConsumption.js';
import medicineRoutes from './routes/medicines.js';
import medicineScheduleRoutes from './routes/medicineSchedules.js';
import reportRoutes from './routes/reports.js';

const __dirname = import.meta.dirname || '.';

dotenv.config();

const app = express();

// CORS configuration - allow all origins in production
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/eggs', eggRoutes);
app.use('/api/feeds', feedRoutes);
app.use('/api/feed-consumption', feedConsumptionRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/medicine-schedules', medicineScheduleRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Poultry Management API is running' });
});

// Debug - Check all users (REMOVE IN PRODUCTION)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await mongoose.model('User').find({}, 'username email createdAt');
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug - Clear all users (REMOVE IN PRODUCTION)
app.post('/api/debug/clear-users', async (req, res) => {
  try {
    await mongoose.model('User').deleteMany({});
    await mongoose.model('Batch').deleteMany({});
    await mongoose.model('EggRecord').deleteMany({});
    await mongoose.model('Feed').deleteMany({});
    res.json({ message: 'All data cleared!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/poultry_db')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

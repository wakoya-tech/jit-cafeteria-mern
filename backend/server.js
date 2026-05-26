import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import specialMealRoutes from './routes/specialMealRoutes.js';
import wasteRoutes from './routes/wasteRoutes.js';
import universitySyncRoutes from './routes/universitySyncRoutes.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import qualityRoutes from './routes/qualityRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    system: 'Jimma University Student Cafeteria Management System',
    institute: 'Jimma University — Institute of Technology (JIT)',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/quality', qualityRoutes);

app.use('/api/special-meals', specialMealRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/university-sync', universitySyncRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error.' });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () =>
      console.log(`Jimma University Cafeteria API running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

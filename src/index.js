import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from '../config/db.js';

import { notFound, errorHandler } from '../middleware/errorMiddleware.js';
import s3Routes from '../routes/s3Routes.js';

import authRoutes from '../routes/authRoutes.js';
import serviceCategoryRoutes from '../routes/serviceCategoryRoutes.js';
import serviceRoutes from '../routes/serviceRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';

import partnerRoutes from '../routes/partnerRoutes.js';
import careerRoutes from '../routes/careerRoutes.js';
import quoteRoutes from '../routes/quoteRoutes.js';

dotenv.config();

const port = process.env.PORT || 5000;

connectDB();

const app = express();

// Enable CORS for frontend
app.use(
  cors({
    origin: 'http://localhost:5173', 
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/s3', s3Routes);

app.use('/api/partners', partnerRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/quotes', quoteRoutes);

// Static files for uploads
const __dirname = path.resolve();

if (process.env.NODE_ENV === 'production') {
  app.use('/uploads', express.static('/var/data/uploads'));
  app.use(express.static(path.join(__dirname, '/frontend/build')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  );
} else {
  app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
  app.get('/', (req, res) => res.send('API is running...'));
}

// Error middleware
app.use(notFound);
app.use(errorHandler);

// Server
app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});

export { app };

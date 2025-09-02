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

import solutionCategoryRoutes from '../routes/solutionCategoryRoutes.js';
import solutionRoutes from '../routes/solutionRoutes.js';
import resourceRoutes from '../routes/resourceRoutes.js';

import notificationRoutes from '../routes/notificationRoutes.js';
import subscriberRoutes from '../routes/subscriberRoutes.js';

import partnerRoutes from '../routes/partnerRoutes.js';
import careerRoutes from '../routes/careerRoutes.js';
import quoteRoutes from '../routes/quoteRoutes.js';
import workplaceRoutes from '../routes/workplaceRoutes.js';

dotenv.config();

const port = process.env.PORT || 5000;

// Connect to DB
connectDB();

const app = express();

// ----------------------
// CORS Configuration
// ----------------------
const allowedOrigins = [
  'http://localhost:5173',            // development frontend
  'https://www.khisima.com',          // production frontend URL from env
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ----------------------
// Middleware
// ----------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ----------------------
// API Routes
// ----------------------
app.use('/api/auth', authRoutes);
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/solution-categories', solutionCategoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/solutions', solutionRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/s3', s3Routes);

app.use('/api/partners', partnerRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/workplaces', workplaceRoutes);

// ----------------------
// Static Files & Frontend
// ----------------------
const __dirname = path.resolve();

// Uploads
if (process.env.NODE_ENV === 'production') {
  app.use('/uploads', express.static('/var/data/uploads'));
} else {
  app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
}

// Frontend build (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'))
  );
} else {
  app.get('/', (req, res) => res.send('API is running...'));
}

// ----------------------
// Error Middleware
// ----------------------
app.use(notFound);
app.use(errorHandler);

// ----------------------
// Start Server
// ----------------------
app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});

export { app };

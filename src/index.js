import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from '../config/db.js';


import { notFound, errorHandler } from '../middleware/errorMiddleware.js';
import authRoutes from '../routes/authRoutes.js';

dotenv.config();

const port = process.env.PORT || 5000;

connectDB();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,               
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);



// Static files and uploads
const __dirname = path.resolve();

if (process.env.NODE_ENV === 'production') {
  app.use('/uploads', express.static('/var/data/uploads'));
  app.use(express.static(path.join(__dirname, '/frontend/build')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  );
} else {
  app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error middleware
app.use(notFound);
app.use(errorHandler);

// Server
app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});


export { app };

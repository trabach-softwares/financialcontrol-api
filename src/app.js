import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import planRoutes from './routes/planRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Middlewares
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { successResponse } from './utils/response.js';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json(successResponse({ status: 'running' }, 'Financial Control API is running'));
});

app.get('/health', (req, res) => {
  res.json(successResponse({ status: 'healthy' }, 'API is healthy'));
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

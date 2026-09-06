import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { config } from './config/env';

// Eagerly register all Mongoose models
import './models';

const app: Application = express();

// Global Middleware
app.use(cors({
  origin: config.clientUrl || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;

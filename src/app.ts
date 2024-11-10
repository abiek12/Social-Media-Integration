import express, { Application, Request, Response } from 'express';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { INTERNAL_ERROR } from './utils/common';
import metaRoutes from './socialMedia/routes/meta.routes';
import facebookAuthRoutes from './socialMedia/routes/auth.routes';
import subscriberRoutes from './users/subscriber/routes/subscriber.route';
import authRoutes from './users/auth/routes/auth.route';

// Load environment variables
dotenv.config();

const app: Application = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express-session setup (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Express server is running!');
});
app.use('/api/v1/meta_auth', facebookAuthRoutes);
app.use('/api/v1/meta', metaRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/subscriber', subscriberRoutes);

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error(error.stack);
  res.status(INTERNAL_ERROR).send('Something went wrong!');
});

export default app;

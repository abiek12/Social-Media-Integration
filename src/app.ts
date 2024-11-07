import express, { Application, Request, Response } from 'express';
import passport from 'passport';
import session from 'express-session';
import dotenv from 'dotenv';
import { AppDataSource } from './utils/dbConfig';

// Load environment variables
dotenv.config();

const app: Application = express();

AppDataSource.initialize()
.then(() => {
  console.log('Database connected successfully');
})
.catch((error) => {
  console.error('Error connecting to the database', error);
});

// Middleware
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

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: any) => {
  console.error(error.stack);
  res.status(500).send('Something went wrong!');
});

export default app;

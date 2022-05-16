// Imports
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import apiRoute from './routes/api.js';

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const MongoURL = process.env.MongoURL;

// Setting up DB connection
mongoose.connect(MongoURL, err => {
  err && console.log(err);
  !err && console.log('DB connection successful');
});

// Middlewares
app.use(express.json());
app.use(helmet());
app.use(morgan('common'));
app.use('/api', apiRoute);

// Routes
app.get('/', (req, res) => {
  res.send('Hey There!');
});

// Setting up server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

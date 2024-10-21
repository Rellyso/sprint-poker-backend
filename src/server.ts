import express from 'express';
import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import { authRoutes } from './routes/auth-routes';

configDotenv();
const app = express();

app.use(express.json())
app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hello World!'
  });
});


const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

mongoose.connect(`mongodb+srv://${dbUser}:${dbPass}@cluster.iso2u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster`).then(() => {
  app.listen(4000, () => {
    console.log('Listening on port 4000');
  });

  console.log('Connected to MongoDB');
})

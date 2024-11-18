import express from 'express';
import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import { authRoutes } from './routes/auth-routes';
import cors from 'cors';
import http from 'http';
import socketIo from 'socket.io';
import { Message } from './models/message';
import { userRoutes } from './routes/user-routes';
import passport from './auth/passport-config';
import { MONGO_URL } from './constants/mongo-url';

configDotenv();
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true, 
}))

app.use(express.json())

app.use(passport.initialize())

app.use('/api/auth', authRoutes)
app.use(userRoutes)

const server = http.createServer(app);

const io = new socketIo.Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

mongoose.connect(MONGO_URL).then(() => {
  app.listen(4000, () => {
    console.log('Listening on port 4000');
  });

  console.log('Connected to MongoDB');
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('sendMessage', async (data) => {
    const newMessage = new Message(data);
    await newMessage.save();
    io.emit('newMessage', newMessage);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

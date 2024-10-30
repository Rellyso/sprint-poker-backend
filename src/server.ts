import express from 'express';
import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import { authRoutes } from './routes/auth-routes';
import cors from 'cors';
import http from 'http';
import socketIo from 'socket.io';
import { Message } from './models/message';
import { userRoutes } from './routes/user-routes';


configDotenv();
const app = express();

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use(userRoutes)

const server = http.createServer(app);

const io = new socketIo.Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

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

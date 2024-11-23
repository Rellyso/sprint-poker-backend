import { Server } from "socket.io";
import { verifyToken } from "../utils/verify-token";
import { configDotenv } from "dotenv";

let io: Server;

configDotenv();
export const initSocket = (httpServer: any) => {
  io = new Server(httpServer);

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      return next(new Error("Token não fornecido"));
    }

    try {
      const decoded = verifyToken(token);
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on('connect', (socket) => {
    console.log('a user connected');
    console.log(socket.handshake.auth.token)
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on('message', (msg) => {
      console.log('message: ' + msg);
      socket.broadcast.emit('message', msg);
    });
  });

  return io;
};

export { io };

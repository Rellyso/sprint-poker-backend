import { Server } from "socket.io";
import { verifyToken } from "../utils/verify-token";
import { configDotenv } from "dotenv";
import { setupRoomEvents } from "../modules/room/events/room-events";
import { RoomService } from "../modules/room/services/room-service";


let io: Server;
configDotenv();

export const initSocket = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  const roomService = new RoomService();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      return next(new Error("Token não fornecido"));
    }

    try {
      const decoded = verifyToken(token);
      socket.data.userId = decoded.userId;
      socket.data.name = decoded.name;
      socket.data.email = decoded.email;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on('connect', (socket) => {
    setupRoomEvents(io, socket, roomService);
  });

  setInterval(() => {
    const rooms = io.sockets.adapter.rooms;

    rooms.forEach((sockets, roomId) => {
      if (io.sockets.adapter.sids.has(roomId)) {
        return;
      }

      const connectedSockets = io.sockets.adapter.rooms.get(roomId);

      if (!connectedSockets || connectedSockets.size === 0) {
        console.log(`Sala ${roomId} está vazia. Limpando dados...`);
        roomService.cleanUpRoom(roomId);
      }
    });
  }, 60000);

  return io;
};

export { io };

import { Server } from "socket.io";
import { verifyToken } from "../utils/verify-token";
import { configDotenv } from "dotenv";
import { User } from "../models/user";
import { setupRoomEvents } from "../modules/room/events/room-events";
import { RoomService } from "../modules/room/services/room-service";


interface UserSession {
  userId: string;
  socketIds: Set<string>;
  userData: {
    name: string;
    email: string;
  };
}

const roomSessions = new Map<string, Map<string, UserSession>>();

let io: Server;
configDotenv();

export const initSocket = (httpServer: any) => {
  io = new Server(httpServer);
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
    console.log('Usuário conectado:', socket.id);

    socket.on('disconnect', async () => {
      try {
        const roomId = socket.data.roomId;
        const userId = socket.data.userId;

        if (roomId && userId) {
          const { votes } = await roomService.removeUserFromSession(roomId, userId);

          const usersWithDetails = await Promise.all(
            votes.map(async (vote) => {
              const user = await User.findById(vote.userId);
              return {
                userId: vote.userId,
                name: user?.name || '',
                email: user?.email || '',
                hasVoted: vote.vote !== null
              };
            })
          );

          io.to(roomId).emit('users-online', usersWithDetails);
        }
      } catch (error) {
        console.error('Erro ao tratar desconexão', error);
      }
    });
  });

  // Adiciona monitoramento de salas
  setInterval(() => {
    const rooms = io.sockets.adapter.rooms;

    rooms.forEach((sockets, roomId) => {
      // Ignora salas reservadas para sockets individuais (não são "rooms" reais)
      if (io.sockets.adapter.sids.has(roomId)) {
        return;
      }

      const connectedSockets = io.sockets.adapter.rooms.get(roomId);

      if (!connectedSockets || connectedSockets.size === 0) {
        console.log(`Sala ${roomId} está vazia. Limpando dados...`);
        // Execute a lógica para limpar os dados da sala
        roomService.cleanUpRoom(roomId); // Certifique-se de implementar isso no serviço
        roomSessions.delete(roomId); // Limpa também do Map local, se necessário
      }
    });
  }, 60000); // Intervalo de 60 segundos

  return io;
};

export { io };

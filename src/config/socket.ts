import { Server } from "socket.io";
import { verifyToken } from "../utils/verify-token";
import { configDotenv } from "dotenv";
import { User } from "../models/user";


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
    socket.on('join-room', async (roomId) => {
      try {
        // Recupera informações do usuário do banco
        const userId = socket.data.userId;
        const user = await User.findById(userId);

        if (!user) {
          socket.emit('error', 'Usuário não encontrado');
          return;
        }

        // Inicializa o mapa de sessões da sala se não existir
        if (!roomSessions.has(roomId)) {
          roomSessions.set(roomId, new Map());
        }

        const roomSessionUsers = roomSessions.get(roomId);

        // Verifica se usuário já está na sala
        if (!roomSessionUsers?.has(userId)) {
          // Cria nova sessão para o usuário
          roomSessionUsers?.set(userId, {
            userId,
            socketIds: new Set([socket.id]),
            userData: {
              name: user.name,
              email: user.email
            }
          });

          // Emite evento de usuário entrou
          io.to(roomId).emit('user-joined', {
            userId,
            name: user.name,
            email: user.email
          });
        } else {
          // Adiciona novo socket ID para usuário existente
          const existingSession = roomSessionUsers.get(userId);
          existingSession?.socketIds.add(socket.id);
        }

        // Atualiza lista de usuários na sala
        const roomSessionUsersArray = Array.from(roomSessions.get(roomId)?.values() || []);
        io.to(roomId).emit('room-users',

          roomSessionUsersArray.map(session => ({
            userId: session.userId,
            name: session.userData.name,
            email: session.userData.email
          }))
        );

        // Junta socket à sala
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.userId = userId;

      } catch (error) {
        console.error('Erro ao entrar na sala', error);
      }
    });

    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      const userId = socket.data.userId;

      if (roomId && userId) {
        const roomSessionUsers = roomSessions.get(roomId);

        if (roomSessionUsers && roomSessionUsers.has(userId)) {
          const userSession = roomSessionUsers.get(userId);

          // Remove socket específico
          userSession?.socketIds.delete(socket.id);

          // Se não houver mais sockets, remove sessão do usuário
          if (userSession?.socketIds.size === 0) {
            roomSessionUsers.delete(userId);

            // Emite atualização de usuários na sala
            io.to(roomId).emit('room-users',
              Array.from(roomSessionUsers.values()).map(session => ({
                userId: session.userId,
                name: session.userData.name,
                email: session.userData.email
              }))
            );
          }
        }
      }
    });
  });

  return io;
};

export { io };

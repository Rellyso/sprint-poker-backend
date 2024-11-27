import { Server, Socket } from "socket.io";
import { RoomService } from "../services/room-service";
import { User } from "../../../models/user";

export function setupRoomEvents(io: Server, socket: Socket, roomService: RoomService) {
  // Evento para submeter voto
  socket.on('submit-vote', async (roomId, vote) => {
    try {
      const userId = socket.data.userId;

      const { votes, session } = await roomService.submitVote(roomId, userId, vote);

      if (session) {
        // Emite lista de usuários que votaram
        io.to(roomId).emit('votes-updated', {
          votedUsers: votes
        });
      }
    } catch (error) {
      console.error('Erro ao submeter voto', error);
      socket.emit('error', 'Erro ao submeter voto');
    }
  });

  // Evento para revelar votos
  socket.on('reveal-votes', async (roomId) => {
    try {
      const session = await roomService.revealVotes(roomId);

      if (session) {
        // Emite votos revelados para todos na sala
        io.to(roomId).emit('votes-revealed', {
          votes: session.votes,
          isRevealed: session.closed
        });
      }
    } catch (error) {
      console.error('Erro ao revelar votos', error);
      socket.emit('error', 'Erro ao revelar votos');
    }
  });

  // apenas entrar na sala se já não estiver na sala
  socket.on('join-room', async ({ roomId, userId }) => {
    try {

      const session = await roomService.getSession(roomId);
      const alreadyInSession = session?.votes.some((vote) => vote.userId === userId);
      console.log('dados', { roomId, userId })
      console.log('está na sessão?', alreadyInSession, userId)

      const { votes } = await roomService.addUserToSession(roomId, userId);
      console.log('votes', votes)

      // Atualiza os usuários com detalhes
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

      // Notifique os usuários da sala sobre o estado atualizado
      // Junta socket à sala
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;

      io.to(roomId).emit('users-online', usersWithDetails);

      // Emite estado de votos e usuários online
      // socket.emit('room-votes-state', {
      //   votes,
      //   usersWithDetails,
      //   isRevealed: session?.closed || false
      // });


    } catch (error) {
      console.error('Erro ao entrar na sala', error);
    }
  });
}
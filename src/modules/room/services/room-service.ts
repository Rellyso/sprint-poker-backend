import { ISession, IVote, Session } from "../../../models/session";
import { User } from "../../../models/user";
import { UserSession, UserJoinData } from "../types/room";

export class RoomService {
  private roomSessions: Map<string, Map<string, UserSession>> = new Map();

  async joinRoom(
    roomId: string,
    userId: string,
    socketId: string
  ): Promise<{
    userSession: UserSession | null,
    roomUsers: UserJoinData[]
  }> {
    try {
      // Recupera informações do usuário do banco
      const user = await User.findById(userId);

      if (!user) {
        return { userSession: null, roomUsers: [] };
      }

      // Inicializa o mapa de sessões da sala se não existir
      if (!this.roomSessions.has(roomId)) {
        this.roomSessions.set(roomId, new Map());
      }

      const roomSessionUsers = this.roomSessions.get(roomId);

      let userSession: UserSession;

      // Verifica se usuário já está na sala
      if (!roomSessionUsers?.has(userId)) {
        // Cria nova sessão para o usuário
        userSession = {
          userId,
          socketIds: new Set([socketId]),
          userData: {
            name: user.name,
            email: user.email
          }
        };
        roomSessionUsers?.set(userId, userSession);
      } else {
        // Adiciona novo socket ID para usuário existente
        userSession = roomSessionUsers.get(userId)!;
        userSession.socketIds.add(socketId);
      }

      // Converte sessões de usuários para formato de join
      const roomUsers = Array.from(roomSessionUsers?.values() || []).map(session => ({
        userId: session.userId,
        name: session.userData.name,
        email: session.userData.email
      }));

      return { userSession, roomUsers };
    } catch (error) {
      console.error('Erro ao entrar na sala', error);
      return { userSession: null, roomUsers: [] };
    }
  }

  async getSession(sessionToken: string): Promise<ISession | null> {
    try {
      return await Session.findOne({ token: sessionToken });
    } catch (error) {
      console.error('Erro ao recuperar sessão', error);
      return null;
    }
  }

  async addUserToSession(
    sessionToken: string,
    userId: string
  ): Promise<{ votes: IVote[], session: ISession | null }> {
    try {
      // Recupera a sessão
      const session = await Session.findOne({ token: sessionToken });

      if (!session) {
        return { votes: [], session: null };
      }

      // Verifica se o usuário já está na lista de votos
      const userExists = session.votes.some(v => v.userId === userId);

      // Se não existir, adiciona usuário com voto null
      if (!userExists) {
        session.votes.push({
          userId,
          vote: null
        });

        // Salva a sessão
        await session.save();
      }

      return {
        votes: session.votes,
        session
      };
    } catch (error) {
      console.error('Erro ao adicionar usuário à sessão', error);
      return { votes: [], session: null };
    }
  }

  async removeUserFromSession(
    sessionToken: string,
    userId: string
  ): Promise<{ votes: IVote[], session: ISession | null }> {
    try {
      // Recupera a sessão e remove o usuário dos votos
      const session = await Session.findOneAndUpdate(
        { token: sessionToken },
        { $pull: { votes: { userId } } },
        { new: true } // Retorna a sessão atualizada
      );

      if (!session) {
        return { votes: [], session: null };
      }

      return {
        votes: session.votes,
        session
      };
    } catch (error) {
      console.error('Erro ao remover usuário da sessão', error);
      return { votes: [], session: null };
    }
  }

  removeUserSocket(
    roomId: string,
    userId: string,
    socketId: string
  ): UserJoinData[] | null {
    const roomSessionUsers = this.roomSessions.get(roomId);

    if (roomSessionUsers && roomSessionUsers.has(userId)) {
      const userSession = roomSessionUsers.get(userId)!;

      // Remove socket específico
      userSession.socketIds.delete(socketId);

      // Se não houver mais sockets, remove sessão do usuário
      if (userSession.socketIds.size === 0) {
        roomSessionUsers.delete(userId);

        // Retorna usuários atualizados
        return Array.from(roomSessionUsers.values()).map(session => ({
          userId: session.userId,
          name: session.userData.name,
          email: session.userData.email
        }));
      }
    }

    return null;
  }


  async submitVote(
    sessionToken: string,
    userId: string,
    vote: string
  ): Promise<{ votes: UserJoinData[], session: ISession | null }> {
    try {
      // Recupera a sessão
      const session = await Session.findOne({ token: sessionToken });

      if (!session) {
        return { votes: [], session: null };
      }

      // Recupera informações do usuário
      const user = await User.findById(userId);
      if (!user) {
        return { votes: [], session: null };
      }

      // Verifica se a sessão já está fechada
      if (session.closed) {
        throw new Error('Sessão já fechada');
      }

      // Remove voto anterior do usuário, se existir
      session.votes = session.votes.filter(v => v.userId !== userId);

      // Adiciona novo voto
      session.votes.push({ userId, vote });

      // Salva a sessão
      await session.save();

      // Recupera informações dos usuários que votaram
      const votedUsers = await Promise.all(
        session.votes.map(async (vote) => {
          const votedUser = await User.findById(vote.userId);
          return {
            userId: vote.userId,
            name: votedUser?.name || '',
            email: votedUser?.email || ''
          };
        })
      );

      return {
        votes: votedUsers,
        session
      };
    } catch (error) {
      console.error('Erro ao submeter voto', error);
      return { votes: [], session: null };
    }
  }

  async revealVotes(sessionToken: string): Promise<ISession | null> {
    try {
      // Encontra e fecha a sessão
      const session = await Session.findOneAndUpdate(
        { token: sessionToken },
        { closed: true },
        { new: true }
      );

      return session;
    } catch (error) {
      console.error('Erro ao revelar votos', error);
      return null;
    }
  }

  async getRoomVotes(sessionToken: string): Promise<{
    votes: IVote[],
    isRevealed: boolean
  }> {
    try {
      const session = await Session.findOne({ token: sessionToken });

      if (!session) {
        return {
          votes: [],
          isRevealed: false
        };
      }

      return {
        votes: session.votes,
        isRevealed: session.closed
      };
    } catch (error) {
      console.error('Erro ao recuperar votos da sala', error);
      return {
        votes: [],
        isRevealed: false
      };
    }
  }

  async cleanUpRoom(sessionToken: string): Promise<void> {
    try {
      await Session.deleteOne({ token: sessionToken });
    } catch (error) {
      console.error('Erro ao limpar sala', error);
    }
  }
}
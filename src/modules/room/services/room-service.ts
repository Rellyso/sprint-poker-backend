import { GameType, ISession, IVote, Session } from "../../../models/session";
import { User } from "../../../models/user";
import { UserSession, UserJoinData } from "../types/room";

export class RoomService {
  private roomSessions: Map<string, Map<string, UserSession>> = new Map();

  async getRoomPlayers(votes: IVote[]): Promise<UserJoinData[]> {
    console.log('Votos recebidos:', votes);

    try {
      const roomPlayers = await Promise.all(
        votes.map(async (vote) => {
          const user = await User.findById(vote.userId);
          return {
            userId: vote.userId,
            name: user?.name || '',
            email: user?.email || '',
            vote: vote.vote
          };
        })
      )

      return roomPlayers.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Erro ao recuperar usuários da sala', error);
      return [];
    }
  }

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

  async addPlayerToSession(
    sessionToken: string,
    userId: string
  ): Promise<{ playersInRoom: UserJoinData[], session: ISession | null }> {
    let playersInRoom: UserJoinData[] = [];

    try {
      // Recupera a sessão
      const session = await Session.findOne({ token: sessionToken });

      if (!session) {
        return { playersInRoom: [], session: null };
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

      playersInRoom = await this.getRoomPlayers(session.votes);

      return {
        playersInRoom,
        session
      };
    } catch (error) {
      console.error('Erro ao adicionar usuário à sessão', error);
      return { playersInRoom: [], session: null };
    }
  }

  async removeUserFromSession(
    sessionToken: string,
    userId: string
  ): Promise<ISession | null> {
    try {
      // Recupera a sessão e remove o usuário dos votos
      const session = await Session.findOneAndUpdate(
        { token: sessionToken },
        { $pull: { votes: { userId } } },
        { new: true } // Retorna a sessão atualizada
      );
      return session
    } catch (error) {
      console.error('Erro ao remover usuário da sessão', error);
      return null;
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

      userSession.socketIds.delete(socketId);

      if (userSession.socketIds.size === 0) {
        roomSessionUsers.delete(userId);

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
    vote: string | null
  ): Promise<{ players: UserJoinData[], session: ISession | null }> {
    try {
      const session = await Session.findOne({ token: sessionToken });

      if (!session) {
        return { players: [], session: null };
      }

      const user = await User.findById(userId);
      if (!user) {
        return { players: [], session: null };
      }

      if (session.closed) {
        throw new Error('Sessão já fechada');
      }

      session.votes = session.votes.filter(v => v.userId !== userId);

      session.votes.push({ userId, vote });

      await session.save();

      const updatedPlayers = await this.getRoomPlayers(session.votes)

      return {
        players: updatedPlayers,
        session
      };
    } catch (error) {
      console.error('Erro ao submeter voto', error);
      return { players: [], session: null };
    }
  }

  async updateRevealVotes(roomId: string, result_revealed: boolean): Promise<ISession | null> {
    try {
      // Encontra e fecha a sessão
      const session = await Session.findOneAndUpdate(
        { token: roomId },
        { result_revealed },
        { new: true }
      );

      return session;
    } catch (error) {
      console.error('Erro ao revelar votos', error);
      return null;
    }
  }

  async updateSessionGameType(sessionToken: string, gameType: GameType): Promise<ISession | null> {
    try {
      // Encontra e fecha a sessão
      const session = await Session.findOneAndUpdate(
        { token: sessionToken },
        { game_type: gameType },
        { new: true }
      );

      return session;
    } catch (error) {
      console.error('Erro ao atualizar o tipo de jogo', error);
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
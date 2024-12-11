import { ObjectId } from 'mongoose'
import { GameType, ISession, IVote, Session } from '../../../models/session'
import { Story } from '../../../models/story'
import { User } from '../../../models/user'
import { UserJoinData } from '../types/room'
import { AppError } from '../../../errors/api-error'

export class RoomService {
  async getRoomPlayers(votes: IVote[]): Promise<UserJoinData[]> {
    console.log('Votos recebidos:', votes)

    try {
      const roomPlayers = await Promise.all(
        votes.map(async (vote) => {
          const user = await User.findById(vote.userId)
          return {
            userId: vote.userId,
            name: user?.name || '',
            email: user?.email || '',
            vote: vote.vote
          }
        })
      )

      return roomPlayers.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error('Erro ao recuperar usuários da sala', error)
      throw error
    }
  }

  async addPlayerToSession(
    sessionToken: string,
    userId: string
  ): Promise<{ playersInRoom: UserJoinData[]; session: ISession | null }> {
    let playersInRoom: UserJoinData[] = []

    try {
      // Recupera a sessão
      const session = await Session.findOne({ token: sessionToken })

      if (!session) {
        return { playersInRoom: [], session: null }
      }

      // Verifica se o usuário já está na lista de votos
      const userExists = session.votes.some((v) => v.userId === userId)

      // Se não existir, adiciona usuário com voto null
      if (!userExists) {
        session.votes.push({
          userId,
          vote: null
        })

        // Salva a sessão
        await session.save()
      }

      playersInRoom = await this.getRoomPlayers(session.votes)

      return {
        playersInRoom,
        session
      }
    } catch (error) {
      console.error('Erro ao adicionar usuário à sessão', error)
      throw error
    }
  }

  async removeUserFromSession(
    sessionToken: string,
    userId: string
  ): Promise<ISession | null> {
    try {
      const session = await Session.findOneAndUpdate(
        { token: sessionToken },
        { $pull: { votes: { userId } } },
        { new: true }
      )
      return session
    } catch (error) {
      console.error('Erro ao remover usuário da sessão', error)
      return null
    }
  }

  async submitVote(
    sessionToken: string,
    userId: string,
    vote: string | null
  ): Promise<{ players: UserJoinData[]; session: ISession | null }> {
    try {
      const session = await Session.findOne({ token: sessionToken })
      if (!session || session.closed) {
        throw new AppError('Sessão já foi encerrada')
      }

      const user = await User.findById(userId)
      if (!user) {
        return { players: [], session: null }
      }

      session.votes = session.votes.filter((v) => v.userId !== userId)
      session.votes.push({ userId, vote })
      await session.save()
      const updatedPlayers = await this.getRoomPlayers(session.votes)

      return {
        players: updatedPlayers,
        session
      }
    } catch (error) {
      console.error('Erro ao submeter voto', error)
      throw new AppError('Sessão já foi encerrada')
    }
  }

  async updateRevealVotes(
    roomId: string,
    result_revealed: boolean
  ): Promise<ISession | null> {
    try {
      // Encontra e fecha a sessão
      const session = await Session.findOneAndUpdate(
        { token: roomId },
        { result_revealed },
        { new: true }
      )

      return session
    } catch (error) {
      console.error('Erro ao revelar votos', error)
      return null
    }
  }

  async resetVotes(
    roomId: string
  ): Promise<{ session: ISession; players: UserJoinData[] }> {
    try {
      // Encontra e fecha a sessão
      const session = await Session.findOne({ token: roomId })

      if (!session || session.closed) {
        throw new AppError('Sessão já foi encerrada')
      }

      session.votes =
        session?.votes.map((vote) => {
          return { ...vote, vote: null }
        }) || []

      await session.save()

      const players = await this.getRoomPlayers(session.votes)

      return { session, players }
    } catch (error) {
      console.error('Erro ao resetar votos', error)
      throw error
    }
  }

  async updateSessionGameType(
    sessionToken: string,
    gameType: GameType
  ): Promise<ISession | null> {
    try {
      // Encontra e fecha a sessão
      const session = await Session.findOneAndUpdate(
        { token: sessionToken },
        { game_type: gameType },
        { new: true }
      )

      if (!session) {
        throw new AppError('Sessão não encontrada')
      }

      return session
    } catch (error) {
      console.error('Erro ao atualizar o tipo de jogo', error)
      throw error
    }
  }

  async cleanUpRoom(sessionToken: string): Promise<void> {
    try {
      await Session.deleteOne({ token: sessionToken })
    } catch (error) {
      console.error('Erro ao limpar sala', error)
      throw error
    }
  }

  async selectStory({
    sessionToken,
    storyId
  }: {
    sessionToken: string
    storyId: string
  }): Promise<ISession> {
    try {
      const session = await Session.findOne({ token: sessionToken })

      if (!session) {
        throw new Error('Sessão não encontrada')
      }

      const story = await Story.findById(storyId)

      if (!story) {
        throw new Error('História não encontrada')
      }

      session.selected_story = story._id as ObjectId

      const sessionSaved = await session.save()

      return sessionSaved
    } catch (error) {
      console.error('Erro ao selecionar história', error)
      throw error
    }
  }

  async deselectStory(sessionToken: string): Promise<ISession> {
    try {
      const session = await Session.findOne({ token: sessionToken })

      if (!session) {
        throw new Error('Sessão não encontrada')
      }

      session.selected_story = null
      const savedSession = await session.save()

      return savedSession
    } catch (error) {
      console.error('Erro ao desselecionar história', error)
      throw error
    }
  }
}

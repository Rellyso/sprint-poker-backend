import { Server, Socket } from 'socket.io'
import { RoomService } from '../services/room-service'
import { GameType } from '../../../models/session'

export function setupRoomEvents(
  io: Server,
  socket: Socket,
  roomService: RoomService
) {
  // Evento para submeter voto
  socket.on(
    '/room/player/vote',
    async ({ roomId, vote }: { roomId: string; vote: string }) => {
      console.log('Evento submit-vote recebido', { roomId, vote })

      try {
        const userId = socket.data.userId
        console.log('UserId:', userId)

        const { session, players } = await roomService.submitVote(
          roomId,
          userId,
          vote
        )

        io.to(roomId).emit('/room/players', players)
        io.to(roomId).emit('/room/info', session)
        socket.emit('/room/player/voted', vote)
      } catch (error) {
        console.error('Erro detalhado:', error)
      }
    }
  )

  // Evento para revelar votos
  socket.on('/room/reveal', async (roomId: string, revealed: boolean) => {
    try {
      const session = await roomService.updateRevealVotes(roomId, revealed)

      if (session) {
        io.to(roomId).emit('/room/revealed', session.result_revealed)
        io.to(roomId).emit('/room/info', session)
      }
    } catch (error) {
      console.error('Erro ao revelar votos', error)
      socket.emit('error', 'Erro ao revelar votos')
    }
  })

  // Evento para revelar votos
  socket.on(
    '/room/game-type/update',
    async (roomId: string, game_type: GameType) => {
      if (game_type !== GameType.fibonacci && game_type !== GameType.decimal) {
        return
      }

      try {
        const session = await roomService.updateSessionGameType(
          roomId,
          game_type
        )

        if (session) {
          io.to(roomId).emit('/room/info', session)
        }
      } catch (error) {
        console.error('Erro ao revelar votos', error)
        socket.emit('error', 'Erro ao revelar votos')
      }
    }
  )

  // apenas entrar na sala se já não estiver na sala
  socket.on('/room/join', async ({ roomId, userId }) => {
    try {
      const { session, playersInRoom } = await roomService.addPlayerToSession(
        roomId,
        userId
      )

      socket.join(roomId)
      socket.data.roomId = roomId
      socket.data.userId = userId

      io.to(roomId).emit('/room/players', playersInRoom)
      io.to(roomId).emit('/room/info', session)
    } catch (error) {
      console.error('Erro ao entrar na sala', error)
    }
  })

  // Evento para sair da sala forcadamente
  socket.on('/room/leave', async ({ roomId, userId }) => {
    try {
      if (roomId && userId) {
        const session = await roomService.removeUserFromSession(roomId, userId)

        if (session) {
          const roomPlayers = await roomService.getRoomPlayers(session.votes)

          io.to(roomId).emit('/room/players', roomPlayers)
        }
      }
    } catch (error) {
      console.error('Erro ao tratar desconexão', error)
    }
  })

  // Evento para sair da sala
  socket.on('disconnect', async () => {
    try {
      const roomId = socket.data.roomId
      const userId = socket.data.userId

      if (roomId && userId) {
        const session = await roomService.removeUserFromSession(roomId, userId)
        const roomPlayers = await roomService.getRoomPlayers(
          session?.votes || []
        )

        io.to(roomId).emit('/room/players', roomPlayers)
      }
    } catch (error) {
      console.error('Erro ao tratar desconexão', error)
    }
  })
}

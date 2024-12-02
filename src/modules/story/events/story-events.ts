

import { Server, Socket } from 'socket.io'
import { StoryService } from '../services/story-service'

export function setupStoryEvents(
  io: Server,
  socket: Socket,
  storyService: StoryService
) {
  
  socket.on('/room/story/submit-score', async ({ roomId, storyId, score }) => {
    try {
      const story = await storyService.updateStoryScore(storyId, score)
      console.log('Story received:', storyId, roomId, score)
      console.log('Story updated:', story)
      io.to(roomId).emit('/room/story/updated', story)
    } catch (error) {
      console.error('Erro ao selecionar história', error)
    }
  })
}

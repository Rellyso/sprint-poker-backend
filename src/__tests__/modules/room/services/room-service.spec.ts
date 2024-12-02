import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomService } from '../../../../modules/room/services/room-service';
import { GameType, Session } from '../../../../models/session';
import { User } from '../../../../models/user';
import { Story } from '../../../../models/story';
import { AppError } from '../../../../errors/api-error';

vi.mock('../../../../models/session');
vi.mock('../../../../models/user', () => ({
  User: {
    findById: vi.fn()
  }
}));
vi.mock('../../../../models/story');

describe('RoomService', () => {
  let roomService: RoomService;

  beforeEach(() => {
    roomService = new RoomService();
    vi.clearAllMocks();
  });

  describe('getRoomPlayers', () => {
    it('should return a list of sorted players based on votes', async () => {
      const votes = [
        { userId: 'user1', vote: '5' },
        { userId: 'user2', vote: '3' }
      ];
    
      vi.mocked(User.findById).mockImplementation((id: string) => {
        const users = {
          user1: { name: 'Alice', email: 'alice@example.com' },
          user2: { name: 'Bob', email: 'bob@example.com' }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Promise.resolve(users[id as keyof typeof users] || null) as any;
      });
    
      const result = await roomService.getRoomPlayers(votes);
    
      expect(result).toEqual([
        { userId: 'user1', name: 'Alice', email: 'alice@example.com', vote: '5' },
        { userId: 'user2', name: 'Bob', email: 'bob@example.com', vote: '3' }
      ]);
    });

    it('should return an error if there is a database error', async () => {
      const votes = [{ userId: 'user1', vote: '5' }];
      
      vi.mocked(User.findById).mockImplementation(() => {
        throw new AppError('Database error');
      });
      
      await expect(roomService.getRoomPlayers(votes)).rejects.toThrow('Database error');
    });
  });

  describe('addPlayerToSession', () => {
    it('should add a player to the session if not already present', async () => {
      const sessionMock = {
        token: 'session1',
        votes: [{ userId: 'user2', vote: null }],
        save: vi.fn().mockResolvedValue(true),
      };
  
      vi.mocked(Session.findOne).mockResolvedValue(sessionMock);
  
      vi.spyOn(roomService, 'getRoomPlayers').mockResolvedValue([
        { userId: 'user2', vote: null, name: 'Alice', email: 'alice@example.com' },
        { userId: 'user1', vote: null, name: 'Bob', email: 'bob@example.com' },
      ]);
  
      const result = await roomService.addPlayerToSession('session1', 'user1');
  
      expect(Session.findOne).toHaveBeenCalledWith({ token: 'session1' });
      expect(sessionMock.votes).toContainEqual({ userId: 'user1', vote: null });
      expect(sessionMock.save).toHaveBeenCalled();
      expect(result.playersInRoom).toEqual([
        { userId: 'user2', vote: null, name: 'Alice', email: 'alice@example.com' },
        { userId: 'user1', vote: null, name: 'Bob', email: 'bob@example.com' },
      ]);
      expect(result.session).toEqual(sessionMock);
    });
  
    it('should return empty players and null session if session is not found', async () => {
      vi.mocked(Session.findOne).mockResolvedValue(null);

      const result = await roomService.addPlayerToSession('invalidToken', 'user1');
  
      expect(result).toEqual({ playersInRoom: [], session: null });
    });
  
    it('should return the same session if user already exists in the session', async () => {
      const sessionMock = {
        token: 'session1',
        votes: [{ userId: 'user1', vote: null, }],
        save: vi.fn().mockResolvedValue(true),
      };
  
      vi.mocked(Session.findOne).mockResolvedValue(sessionMock);
  
      vi.spyOn(roomService, 'getRoomPlayers').mockResolvedValue([
        { userId: 'user1', vote: null, name: 'Alice', email: 'alice@example.com' },
      ]);
  
      const result = await roomService.addPlayerToSession('session1', 'user1');
  
      expect(roomService.getRoomPlayers).toHaveBeenCalledWith(sessionMock.votes);
  
      expect(result.playersInRoom).toEqual([{ userId: 'user1', vote: null, name: 'Alice', email: 'alice@example.com' }]);
      expect(result.session).toEqual(sessionMock);
    });
  
    it('should throw an error if there is a problem with the session retrieval', async () => {
      const error = new Error('Database error');
      vi.mocked(Session.findOne).mockRejectedValue(error);
      await expect(roomService.addPlayerToSession('session1', 'user1'))
        .rejects
        .toThrow('Database error');
  
    });
  });
  

  describe('submitVote', () => {
    it('should update vote for the user in the session', async () => {
      const sessionMock = {
        token: 'session1',
        votes: [{ userId: 'user2', vote: '3' }],
        closed: false,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Session.findOne).mockResolvedValue(sessionMock);
      vi.mocked(User.findById).mockResolvedValue({
        _id: 'user1',
        name: 'Alice',
        email: 'alice@example.com',
      });

      const result = await roomService.submitVote('session1', 'user1', '5');

      expect(sessionMock.votes).toContainEqual({ userId: 'user1', vote: '5' });
      expect(result.players).toBeDefined();
      expect(result.session).toEqual(sessionMock);
    });

    it('should return an error if the session is closed', async () => {
      const sessionMock = { token: 'session1', closed: true };

      vi.mocked(Session.findOne).mockResolvedValue(sessionMock);

      await expect(
        roomService.submitVote('session1', 'user1', '5')
      ).rejects.toThrow('Sessão já foi encerrada');
    });
  });

  describe('selectStory', () => {
    it('should select a story in the session', async () => {
      const storyMock = { _id: 'story1' };
      const sessionMock = { token: 'session1', selected_story: null, save: vi.fn().mockResolvedValue({
        selected_story: 'story1'
      }) };

      vi.mocked(Session.findOne).mockResolvedValue(sessionMock);
      vi.mocked(Story.findById).mockResolvedValue(storyMock);

      const result = await roomService.selectStory({ sessionToken: 'session1', storyId: 'story1' });

      console.log({
        sessionMock,
        storyMock,
        result
      })
      
      expect(sessionMock.selected_story).toEqual('story1');
      expect(sessionMock.save).toHaveBeenCalled();
      expect(result).toEqual({
        selected_story: 'story1'
      });
    });

    it('should throw an error if the story is not found', async () => {
      vi.mocked(Story.findById).mockResolvedValue(null);

      await expect(
        roomService.selectStory({ sessionToken: 'session1', storyId: 'story1' })
      ).rejects.toThrow('História não encontrada');
    });
  });
  
  describe('updateSessionGameType', () => {
    it('should update the game type in the session', async () => {
      const sessionMock: {
        token: string;
        gameType: GameType;
      } = { token: 'session1', gameType: GameType.decimal};

      vi.mocked(Session.findOneAndUpdate).mockResolvedValue(sessionMock);

      await roomService.updateSessionGameType('session1', GameType.decimal);

      expect(Session.findOneAndUpdate).toHaveBeenCalledWith({ token: 'session1' }, { game_type: GameType.decimal }, { new: true });
      expect(sessionMock.gameType).toBe(GameType.decimal);
    });

    it('should throw an error if the session is not found', async () => {
      vi.mocked(Session.findOneAndUpdate).mockResolvedValue(null);

      await expect(roomService.updateSessionGameType('invalidToken', GameType.decimal)).rejects.toThrow(
        'Sessão não encontrada'
      );
    });
  });

  describe('cleanUpRoom', () => {
    it('should delete the session by token', async () => {
      vi.mocked(Session.deleteOne).mockResolvedValue({ deletedCount: 1 } as never);
  
      await roomService.cleanUpRoom('session1');
  
      expect(Session.deleteOne).toHaveBeenCalledWith({ token: 'session1' });
    });
  
    it('should throw an error if deletion fails', async () => {
      const error = new Error('Database error');
      vi.mocked(Session.deleteOne).mockRejectedValue(error);
  
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  
      await expect(roomService.cleanUpRoom('session1')).rejects.toThrow(error);
  
      expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao limpar sala', error);
  
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateRevealVotes', () => {
    it('should update the result_revealed field and return the updated session', async () => {
      const updatedSessionMock = {
        token: 'room1',
        result_revealed: true,
      };
  
      vi.mocked(Session.findOneAndUpdate).mockResolvedValue(updatedSessionMock as never);
  
      const result = await roomService.updateRevealVotes('room1', true);
  
      expect(Session.findOneAndUpdate).toHaveBeenCalledWith(
        { token: 'room1' },
        { result_revealed: true },
        { new: true }
      );
  
      expect(result).toEqual(updatedSessionMock);
    });
  
    it('should return null if an error occurs', async () => {
      const error = new Error('Database error');
      vi.mocked(Session.findOneAndUpdate).mockRejectedValue(error);
      const result = await roomService.updateRevealVotes('room1', true);
      expect(result).toBeNull();
    });
  });

  describe('removeUserFromSession', () => {
    it('should remove a user from the session and return the updated session', async () => {
      const updatedSessionMock = {
        token: 'session1',
        votes: [{ userId: 'user1', vote: '5' }, { userId: 'user2', vote: '3' }],
      };
  
      vi.mocked(Session.findOneAndUpdate).mockResolvedValue(updatedSessionMock as never);
  
      const result = await roomService.removeUserFromSession('session1', 'user2');
  
      expect(Session.findOneAndUpdate).toHaveBeenCalledWith(
        { token: 'session1' },
        { $pull: { votes: { userId: 'user2' } } },
        { new: true }
      );
  
      expect(result).toEqual(updatedSessionMock);
    });
  
    it('should return null if an error occurs', async () => {
      const error = new Error('Database error');
      vi.mocked(Session.findOneAndUpdate).mockRejectedValue(error);
      const result = await roomService.removeUserFromSession('session1', 'user2');
      expect(result).toBeNull();
    });
  
    it('should return the session with the user removed if the user is found', async () => {
      const sessionMock = {
        token: 'session1',
        votes: [{ userId: 'user1', vote: '5' }, { userId: 'user2', vote: '3' }],
        save: vi.fn().mockResolvedValue(true),
      };
  
      vi.mocked(Session.findOneAndUpdate).mockResolvedValue(sessionMock as never);
  
      const result = await roomService.removeUserFromSession('session1', 'user2');
  
      expect(result).toEqual(sessionMock);
      expect(Session.findOneAndUpdate).toHaveBeenCalledWith(
        { token: 'session1' },
        { $pull: { votes: { userId: 'user2' } } },
        { new: true }
      );
    });
  
    it('should return null if session is not found', async () => {
      vi.mocked(Session.findOneAndUpdate).mockResolvedValue(null);
  
      const result = await roomService.removeUserFromSession('invalidSessionToken', 'user1');
  
      expect(result).toBeNull();
    });
  });
});

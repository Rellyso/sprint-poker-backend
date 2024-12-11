import { StoryRepository } from '../../../../modules/story/repositories/story-repository';
import { Story } from '../../../../models/story';
import { ISession, Session } from '../../../../models/session';
import { create } from 'domain';
import { IStory } from '../../../../modules/story/entities/story-entity';
import { CreateStoryDTO } from '../../../../modules/story/dtos/create-story-dto';

vi.mock('../../../../models/story', () => ({
  Story: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  },
}));

vi.mock('../../../../models/session', () => ({
  Session: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
  },
}));

describe('StoryRepository', () => {
  let storyRepository: StoryRepository;

  beforeEach(() => {
    storyRepository = new StoryRepository();
    vi.clearAllMocks();
  });

  describe('create', async () => {

    it('should create a story and associate it with a session', async () => {
      const mockSession = {
        _id: 'session123',
        token: 'sessionToken',
        stories: [],
        save: vi.fn().mockResolvedValue(true), // Mock do save
      };

      const mockStory = {
        _id: 'story123',
        code: 'ST001',
        name: 'Test Story',
        link: 'http://example.com',
        description: 'A test story',
        session: mockSession,
        save: vi.fn().mockResolvedValue(true), // Mock do save
      };

      // Mock de Session.findOne para retornar a sessão com o token correto
      vi.mocked(Session.findOne).mockResolvedValue(mockSession);

      // Mock de Story.create para retornar a história criada
      vi.mocked(Story.create).mockResolvedValue(mockStory);

      // Dados de entrada
      const data = {
        sessionToken: 'sessionToken',
        code: 'ST001',
        name: 'Test Story',
        link: 'http://example.com',
        description: 'A test story',
      };

      // Executar o método de criação
      const result = await storyRepository.create(data);

      // Verificar se o Session.findOne foi chamado com o token correto
      expect(Session.findOne).toHaveBeenCalledWith({ token: 'sessionToken' });
      
      // Verificar se a história foi associada à sessão
      expect(mockSession.stories).toContain(mockStory._id);

      // Verificar se o método save da sessão foi chamado
      expect(mockSession.save).toHaveBeenCalled();
    
    });

    it('should throw an error if session is not found', async () => {
      // Mock para a situação onde a sessão não é encontrada
      vi.mocked(Session.findOne).mockResolvedValue(null);

      const data = {
        sessionToken: 'invalidToken',
        code: 'ST001',
        name: 'Test Story',
        link: 'http://example.com',
        description: 'A test story',
      };

      // Esperar que seja lançada uma exceção caso a sessão não seja encontrada
      await expect(storyRepository.create(data)).rejects.toThrow('Sessão não encontrada');
      
      // Verificar que a consulta foi feita com o token correto
      expect(Session.findOne).toHaveBeenCalledWith({ token: 'invalidToken' });
    });
  });

  describe('findById', () => {
    it('should return a story by ID', async () => {
      const mockStory = { _id: 'story-id', name: 'Story 1' };
      vi.mocked(Story.findById).mockResolvedValue(mockStory);

      const result = await storyRepository.findById('story-id');

      expect(Story.findById).toHaveBeenCalledWith('story-id');
      expect(result).toEqual(mockStory);
    });

    it('should return null if the story is not found', async () => {
      vi.mocked(Story.findById).mockResolvedValue(null);

      const result = await storyRepository.findById('invalid-id');

      expect(Story.findById).toHaveBeenCalledWith('invalid-id');
      expect(result).toBeNull();
    });
  });

  describe('updateScore', () => {
    it('should update the score of a story', async () => {
      const updatedStory = { _id: 'story-id', score: '5' };
      vi.mocked(Story.findByIdAndUpdate).mockResolvedValue(updatedStory);

      const result = await storyRepository.updateScore('story-id', '5');

      expect(Story.findByIdAndUpdate).toHaveBeenCalledWith('story-id', { score: '5' }, { new: true });
      expect(result).toEqual(updatedStory);
    });
  });

  describe('findStoriesBySessionToken', () => {
    it('should return stories for a given session token', async () => {
      const mockSession = {
        stories: [{ _id: 'story1' }, { _id: 'story2' }],
      };
  
      // Mock de Session.findOne
      const populateMock = vi.fn().mockResolvedValue(mockSession);
      vi.mocked(Session.findOne).mockReturnValue({ populate: populateMock } as never);
  
      const result = await storyRepository.findStoriesBySessionToken('token123');
  
      expect(Session.findOne).toHaveBeenCalledWith({ token: 'token123' });
      expect(populateMock).toHaveBeenCalledWith('stories');
      expect(result).toEqual(mockSession.stories);
    });
  
    it('should return an empty array if session is not found', async () => {
      // Mock de Session.findOne para retornar null
      const populateMock = vi.fn().mockResolvedValue(null);
      vi.mocked(Session.findOne).mockReturnValue({ populate: populateMock } as never);
  
      const result = await storyRepository.findStoriesBySessionToken('invalid-token');
  
      expect(Session.findOne).toHaveBeenCalledWith({ token: 'invalid-token' });
      expect(populateMock).toHaveBeenCalledWith('stories');
      expect(result).toEqual([]);
  });
  });

  describe('delete', () => {
    it('should delete a story and remove it from the session', async () => {
      const mockStory = { _id: 'story-id' };

      vi.mocked(Story.findByIdAndDelete).mockResolvedValue(mockStory);
      vi.mocked(Session.updateOne).mockResolvedValue({} as never);

      await storyRepository.delete('story-id');

      expect(Story.findByIdAndDelete).toHaveBeenCalledWith('story-id');
      expect(Session.updateOne).toHaveBeenCalledWith(
        { stories: mockStory._id },
        { $pull: { stories: mockStory._id } },
      );
    });

    it('should throw an error if the story is not found', async () => {
      vi.mocked(Story.findByIdAndDelete).mockResolvedValue(null);

      await expect(storyRepository.delete('invalid-id')).rejects.toThrow('História não encontrada');
      expect(Story.findByIdAndDelete).toHaveBeenCalledWith('invalid-id');
    });
  });
});

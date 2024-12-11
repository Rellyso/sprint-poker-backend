import { StoryService } from '../../../../modules/story/services/story-service';
import { IStoryRepository } from '../../../../modules/story/repositories/story-repository-interface';
import { CreateStoryDTO } from '../../../../modules/story/dtos/create-story-dto';
import { IStory } from '../../../../modules/story/entities/story-entity';
import { Mocked } from 'vitest';

const storyRepositoryMock: Mocked<IStoryRepository> = {
  create: vi.fn(),
  updateScore: vi.fn(),
  findStoriesBySessionToken: vi.fn(),
  findById: vi.fn(),
  delete: vi.fn(),
};

const storyService = new StoryService(storyRepositoryMock);

describe('StoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createStory', () => {
    it('should create a story successfully', async () => {
      const commonData = { name: 'Story 1', code: 'STORY1', link: 'https://example.com', description: 'A test story', }
      const data: CreateStoryDTO = { ...commonData, sessionToken: 'session1' };
      const createdStory: IStory = { ...commonData, _id: '1', score: '0', session: 'session1' };

      vi.mocked(storyRepositoryMock.create).mockResolvedValue(createdStory);

      const result = await storyService.createStory(data);

      expect(storyRepositoryMock.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(createdStory);
    });

    it('should throw an error if repository throws an error', async () => {
      const data: CreateStoryDTO = { name: 'Story 1', sessionToken: 'session1', description: 'A test story', code: 'STORY1', link: 'https://example.com' };

      vi.mocked(storyRepositoryMock.create).mockRejectedValue(new Error('Database error'));

      await expect(storyService.createStory(data)).rejects.toThrow('Database error');
    });
  });

  describe('updateStoryScore', () => {
    it('should update the story score successfully', async () => {
      const updatedStory: IStory = { _id: '1', name: 'Story 1', score: '5', description: 'Test',session: 'session1' };

      vi.mocked(storyRepositoryMock.updateScore).mockResolvedValue(updatedStory);

      const result = await storyService.updateStoryScore('1', '5');

      expect(storyRepositoryMock.updateScore).toHaveBeenCalledWith('1', '5');
      expect(result).toEqual(updatedStory);
    });

    it('should throw an error if story is not found', async () => {
      vi.mocked(storyRepositoryMock.updateScore).mockResolvedValue(null);

      await expect(storyService.updateStoryScore('invalid-id', '5')).rejects.toThrow('História não encontrada');
    });
  });

  describe('listStoriesBySession', () => {
    it('should return a list of stories for the given session token', async () => {
      const stories: IStory[] = [
        { _id: '1', name: 'Story 1', score: '0', session: 'session1', description: 'Test' },
        { _id: '2', name: 'Story 2', score: '3', session: 'session1', description: 'Test2' },
      ];

      vi.mocked(storyRepositoryMock.findStoriesBySessionToken).mockResolvedValue(stories);

      const result = await storyService.listStoriesBySession('session1');

      expect(storyRepositoryMock.findStoriesBySessionToken).toHaveBeenCalledWith('session1');
      expect(result).toEqual(stories);
    });
  });

  describe('listStoryById', () => {
    it('should return a story by its ID', async () => {
      const story: IStory = { _id: '1', name: 'Story 1', score: '0', description: 'Test', session: 'session1',  };

      vi.mocked(storyRepositoryMock.findById).mockResolvedValue(story);

      const result = await storyService.listStoryById('1');

      expect(storyRepositoryMock.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(story);
    });

    it('should return null if story is not found', async () => {
      vi.mocked(storyRepositoryMock.findById).mockResolvedValue(null);

      const result = await storyService.listStoryById('invalid-id');

      expect(storyRepositoryMock.findById).toHaveBeenCalledWith('invalid-id');
      expect(result).toBeNull();
    });
  });

  describe('deleteStory', () => {
    it('should delete a story successfully', async () => {
      vi.mocked(storyRepositoryMock.delete).mockResolvedValue();

      await storyService.deleteStory('1');

      expect(storyRepositoryMock.delete).toHaveBeenCalledWith('1');
    });

    it('should throw an error if repository throws an error', async () => {
      vi.mocked(storyRepositoryMock.delete).mockRejectedValue(new Error('Database error'));

      await expect(storyService.deleteStory('1')).rejects.toThrow('Database error');
    });
  });
});

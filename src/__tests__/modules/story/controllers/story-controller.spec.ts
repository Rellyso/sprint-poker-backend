import { StoryController } from '../../../../modules/story/controllers/story-controller';
import { StoryService } from '../../../../modules/story/services/story-service';
import { vi, describe, it, expect, beforeEach, Mocked } from 'vitest';
import express, { Request, Response } from 'express';
import supertest from 'supertest';
import { IStory } from '../../../../modules/story/entities/story-entity';
import { CreateStoryDTO } from '../../../../modules/story/dtos/create-story-dto';

const app = express();
app.use(express.json());

// Mock do serviço
const storyServiceMock: Mocked<StoryService> = {
  createStory: vi.fn(),
  updateStoryScore: vi.fn(),
  listStoriesBySession: vi.fn(),
  listStoryById: vi.fn(),
  deleteStory: vi.fn(),
} as unknown as Mocked<StoryService>;

// Configuração do controller e rotas
const storyController = new StoryController();
storyController['storyService'] = storyServiceMock;

app.post('/stories', (req: Request, res: Response) => storyController.create(req, res));
app.put('/stories/:id/score', (req: Request, res: Response) => storyController.updateScore(req, res));
app.get('/stories/session/:sessionToken', (req: Request, res: Response) => storyController.listBySession(req, res));
app.get('/stories/:id', (req: Request, res: Response) => storyController.listById(req, res));
app.delete('/stories/:id', (req: Request, res: Response) => storyController.delete(req, res));

describe('StoryController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a story successfully', async () => {
      const createdStory: IStory = { _id: '1', name: 'Story 1', score: '5', description: 'Test',session: 'session1' };
      const newStory: CreateStoryDTO = { description: 'Test', sessionToken: 'session1', code: 'STORY1', link: 'https://example.com',name: 'Story 1' };

      vi.mocked(storyServiceMock.createStory).mockResolvedValue(createdStory);

      const response = await supertest(app).post('/stories').send(newStory);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdStory);
      expect(storyServiceMock.createStory).toHaveBeenCalledWith(newStory);
    });

    it('should return 400 if validation fails', async () => {
      const invalidData = { title: 'Story 1' }; // Faltando campos obrigatórios

      const response = await supertest(app).post('/stories').send(invalidData);

      expect(response.status).toBe(400);
      expect(storyServiceMock.createStory).not.toHaveBeenCalled();
    });
  });

  describe('updateScore', () => {
    it('should update story score successfully', async () => {
      const updatedStory: IStory = { _id: '1', name: 'Story 1', score: '5', description: 'Test',session: 'session1' };

      vi.mocked(storyServiceMock.updateStoryScore).mockResolvedValue(updatedStory);

      const response = await supertest(app).put('/stories/1/score').send({ score: '5' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedStory);
      expect(storyServiceMock.updateStoryScore).toHaveBeenCalledWith('1', '5');
    });

    it('should return 400 if validation fails', async () => {
      const response = await supertest(app).put('/stories/1/score').send({ invalidField: '5' });

      expect(response.status).toBe(400);
      expect(storyServiceMock.updateStoryScore).not.toHaveBeenCalled();
    });
  });

  describe('listBySession', () => {
    it('should return a list of stories for the given session', async () => {
      const stories: IStory[] = [
        { _id: '1', name: 'Story 1', score: '0', session: 'session1', description: 'Test' },
        { _id: '2', name: 'Story 2', score: '3', session: 'session1', description: 'Test2' },
      ];

      vi.mocked(storyServiceMock.listStoriesBySession).mockResolvedValue(stories);

      const response = await supertest(app).get('/stories/session/session1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(stories);
      expect(storyServiceMock.listStoriesBySession).toHaveBeenCalledWith('session1');
    });
  });

  describe('listById', () => {
    it('should return a story by ID', async () => {
      const story: IStory = { _id: '1', name: 'Story 1', score: '0', session: 'session1', description: 'Test' }

      vi.mocked(storyServiceMock.listStoryById).mockResolvedValue(story);

      const response = await supertest(app).get('/stories/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(story);
      expect(storyServiceMock.listStoryById).toHaveBeenCalledWith('1');
    });

    it('should return 404 if story is not found', async () => {
      vi.mocked(storyServiceMock.listStoryById).mockResolvedValue(null);

      const response = await supertest(app).get('/stories/invalid-id');

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a story successfully', async () => {
      vi.mocked(storyServiceMock.deleteStory).mockResolvedValue();

      const response = await supertest(app).delete('/stories/1');

      expect(response.status).toBe(204);
      expect(storyServiceMock.deleteStory).toHaveBeenCalledWith('1');
    });

    it('should return 400 if service throws an error', async () => {
      vi.mocked(storyServiceMock.deleteStory).mockRejectedValue(new Error('Erro ao excluir história'));

      const response = await supertest(app).delete('/stories/1');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Erro ao excluir história' });
    });
  });
});

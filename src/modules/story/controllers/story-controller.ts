import { Request, Response } from 'express';
import { StoryService } from '../services/story-service';
import { StoryRepository } from '../repositories/story-repository';
import { CreateStorySchema, UpdateStoryScoreSchema } from '../schemas/story-schema';

export class StoryController {
  private storyService: StoryService;

  constructor() {
    const storyRepository = new StoryRepository();
    this.storyService = new StoryService(storyRepository);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = CreateStorySchema.parse(req.body);
      const story = await this.storyService.createStory(data.sessionToken, data);
      res.status(201).json(story);
      return 
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return 
      }
      res.status(500).json({ message: 'Erro interno do servidor' });
      return 
    }
  }

  async updateScore(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { score } = UpdateStoryScoreSchema.parse(req.body);
      
      const story = await this.storyService.updateStoryScore(id, score);
      res.json(story);
      return 
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return
      }
      res.status(500).json({ message: 'Erro interno do servidor' });
      return
    }
  }

  async listBySession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionToken } = req.params;
      const stories = await this.storyService.listStoriesBySession(sessionToken);
      res.json(stories);
      return 
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return
      }
      res.status(500).json({ message: 'Erro interno do servidor' });
      return
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.storyService.deleteStory(id);
      res.status(204).send();
      return
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return
      }
      res.status(500).json({ message: 'Erro interno do servidor' });
      return
    }
  }
}
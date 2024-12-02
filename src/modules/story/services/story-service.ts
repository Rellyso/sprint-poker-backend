import { IStoryRepository } from '../repositories/story-repository-interface';
import { CreateStoryDTO } from '../dtos/create-story-dto';
import { IStory } from '../entities/story-entity';
import { AppError } from '../../../errors/api-error';

export class StoryService {
  constructor(
    private storyRepository: IStoryRepository
  ) {}

  async createStory(data: CreateStoryDTO): Promise<IStory> {
    try {
      return await this.storyRepository.create(data);
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      } else {
        throw new AppError('Erro ao criar história', 400);
      }
    }
  }

  async updateStoryScore(id: string, score: string): Promise<IStory> {
    const story = await this.storyRepository.updateScore(id, score);
    
    if (!story) {
      throw new AppError('História não encontrada', 404);
    }

    return story;
  }

  async listStoriesBySession(sessionToken: string): Promise<IStory[]> {
    return this.storyRepository.findStoriesBySessionToken(sessionToken);
  }


  async listStoryById(id: string): Promise<IStory | null> {
    return this.storyRepository.findById(id);
  }

  async deleteStory(id: string): Promise<void> {
    try {
      await this.storyRepository.delete(id);
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      } else {
        throw new AppError('Erro ao excluir história', 400);
      }
    }
  }
}
import { CreateStoryDTO } from '../dtos/create-story-dto';
import { IStory } from '../entities/story-entity';

export interface IStoryRepository {
  create(data: Omit<CreateStoryDTO, 'id'>): Promise<IStory>;
  findById(id: string): Promise<IStory | null>;
  updateScore(id: string, score: number): Promise<IStory | null>;
  findStoriesBySessionToken(sessionToken: string): Promise<IStory[]>;
  delete(id: string): Promise<void>; // Novo método
}
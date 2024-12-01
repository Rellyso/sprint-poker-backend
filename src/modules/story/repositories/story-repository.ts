import { IStoryRepository } from './story-repository-interface';
import { IStory } from '../entities/story-entity';
import { Story } from '../../../models/story';
import { Session } from '../../../models/session';
import { ObjectId } from 'mongoose';
import { CreateStoryDTO } from '../dtos/create-story-dto';

export class StoryRepository implements IStoryRepository {
  async create(data: CreateStoryDTO): Promise<IStory> {
    const session = await Session.findOne({ token: data.sessionToken });
    
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    const story = new Story({
      code: data.code,
      name: data.name,
      link: data.link,
      description: data.description,
      session: session
    });

    const storyCreated = await story.save();

    session.stories.push(story._id as ObjectId);
    await session.save();

    return storyCreated.toObject() as unknown as IStory;
  }

  async findById(id: string): Promise<IStory | null> {
    return Story.findById(id);
  }

  async updateScore(id: string, score: number): Promise<IStory | null> {
    return Story.findByIdAndUpdate(
      id, 
      { score }, 
      { new: true }
    );
  }

  async findStoriesBySessionToken(sessionToken: string): Promise<IStory[]> {
    const session = await Session.findOne({ token: sessionToken }).populate('stories');
    return session ? session.stories as unknown as IStory[] : [];
  }

  async delete(id: string): Promise<void> {
    const story = await Story.findByIdAndDelete(id);
    
    if (!story) {
      throw new Error('História não encontrada');
    }

    await Session.updateOne(
      { stories: story._id },
      { $pull: { stories: story._id } }
    );
  }
}
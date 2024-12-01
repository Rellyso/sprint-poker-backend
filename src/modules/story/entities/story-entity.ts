import { ObjectId } from 'mongoose';

export interface IStory {
  id?: string;
  name: string;
  link?: string;
  description?: string;
  score?: number;
  session: ObjectId;
}
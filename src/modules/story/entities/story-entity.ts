import { ObjectId } from 'mongoose';

export interface IStory {
  _id?: string;
  name: string;
  link?: string;
  description?: string;
  score?: string;
  session: ObjectId | string;
}
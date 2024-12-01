import mongoose, { Document, ObjectId, Schema } from 'mongoose'
import { IStory } from './story'

export interface IVote {
  userId: string
  vote: string | null
}

export enum GameType {
  fibonacci = 'Fibonacci',
  decimal = 'Decimal'
}
export interface ISession extends Document {
  title: string
  token: string
  owner: string
  votes: IVote[]
  closed: boolean
  game_type: GameType
  result_revealed: boolean
  stories: Array<ObjectId | IStory>;
}

const voteSchema = new Schema<IVote>({
  userId: { type: String, required: true },
  vote: { type: String, required: false, default: null }
})

const sessionSchema = new Schema<ISession>({
  title: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  result_revealed: { type: Boolean, default: false },
  votes: { type: [voteSchema], default: [] },
  closed: { type: Boolean, default: false },
  game_type: { type: String, default: GameType.fibonacci },
  stories: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Story',
    default: [] 
  }]
})

export const Session = mongoose.model<ISession>('Session', sessionSchema)

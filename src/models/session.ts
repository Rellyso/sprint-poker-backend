import mongoose, { Document, Schema } from "mongoose";

export interface IVote {
  userId: string;
  vote: number;  
}

export interface ISession extends Document {
  title: string;  
  token: string;  
  owner: string;  
  votes: IVote[]; 
  closed: boolean;
}

const voteSchema = new Schema<IVote>({
  userId: { type: String, required: true },
  vote: { type: Number, required: true },
});

const sessionSchema = new Schema<ISession>({
  title: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  votes: { type: [voteSchema], default: [] },
  closed: { type: Boolean, default: false },
});

export const Session = mongoose.model<ISession>("Session", sessionSchema);

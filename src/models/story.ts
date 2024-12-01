import mongoose, { Document, Schema, Types } from "mongoose";
import { ISession } from "./session"; 

export interface IStory extends Document {
  name: string;
  code: string;
  link?: string;
  description?: string;
  score?: number;
  session: Types.ObjectId | ISession;
}

const storySchema = new Schema<IStory>({
  name: { 
    type: String, 
    required: true 
  },
  code: { 
    type: String, 
    required: true 
  },
  link: { 
    type: String, 
    required: false 
  },
  description: { 
    type: String, 
    required: false 
  },
  score: { 
    type: Number, 
    required: false,
    default: null 
  },
  session: { 
    type: Schema.Types.ObjectId, 
    ref: 'Session', 
    required: true 
  }
}, {
  timestamps: true 
});

export const Story = mongoose.model<IStory>("Story", storySchema);
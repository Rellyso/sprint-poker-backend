import mongoose, { Schema } from "mongoose";

interface IMessage {
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export const Message = mongoose.model<IMessage>('Message', MessageSchema)


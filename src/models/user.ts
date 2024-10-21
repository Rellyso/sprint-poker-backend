import { compare, genSalt, hash } from "bcrypt";
import mongoose, { Document, Model } from "mongoose";
import { Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }
})

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await genSalt(12);
  const passwordHash = await hash(this.password, salt);
  this.password = passwordHash
  next();
});

userSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  console.log(compare(candidatePassword, this.password))

  return compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
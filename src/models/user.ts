import { compare, genSalt, hash } from 'bcrypt'
import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  googleId?: string
  githubId?: string
  comparePassword(candidatePassword: string): Promise<boolean>
}

export const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  githubId: { type: String, unique: true, sparse: true }
})

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()

  const salt = await genSalt(12)
  const passwordHash = await hash(this.password, salt)
  this.password = passwordHash

  next()
})

userSchema.methods.comparePassword = function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return Promise.resolve(false)
  return compare(candidatePassword, this.password)
}

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema)

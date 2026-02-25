import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({
    required: true,
    unique: true,
    index: true,
    minlength: 8,
    maxlength: 8,
  })
  studentId: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  fullName: string;

  @Prop()
  avatar?: string;

  @Prop({ default: 'student' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);

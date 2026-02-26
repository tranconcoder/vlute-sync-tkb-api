import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, index: true })
  vlute_id: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  student_id: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ type: Object })
  google_info?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };

  @Prop({ required: true })
  full_name: string;

  @Prop()
  date_of_birth?: string;

  @Prop()
  class_id?: string;

  @Prop()
  class_name?: string;

  @Prop()
  major_id?: string;

  @Prop()
  major_name?: string;

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

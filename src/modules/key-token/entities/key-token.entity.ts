import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'key_tokens' })
export class KeyToken extends Document {
  /**
   * System UserID (Reference to the user in the system)
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  /**
   * 3rd Party Student ID (Student ID from provider)
   */
  @Prop({ required: true, index: true })
  student_id: string;

  /**
   * History of RSA Public Keys (Max 3 latest records for rotation)
   */
  @Prop({ type: [String], default: [] })
  publicKeyHistory: string[];

  /**
   * Encrypted third-party token (AES-256-GCM)
   */
  @Prop({ required: true })
  encryptedToken: string;

  /**
   * Salt (Nonce) used for key derivation (Combined with Master Key and JWT Secret)
   */
  @Prop({ required: true })
  nonce: string;

  /**
   * Initialization Vector (IV) for Token encryption
   */
  @Prop({ required: true })
  iv: string;

  /**
   * Authentication Tag to ensure Token integrity
   */
  @Prop({ required: true })
  authTag: string;

  /**
   * Token expiration time
   */
  @Prop({ required: true })
  expiresAt: Date;

  /**
   * Optional additional metadata from provider
   */
  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const KeyTokenSchema = SchemaFactory.createForClass(KeyToken);

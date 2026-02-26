import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KeyToken } from './entities/key-token.entity';
import { EncryptionService } from '../encryption/encryption.service';
import { JwtTokenService } from '../jwt-token/jwt-token.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class KeyTokenService {
  private readonly logger = new Logger(KeyTokenService.name);
  private readonly REDIS_KEY_PREFIX = 'keytoken:';

  constructor(
    @InjectModel(KeyToken.name)
    private readonly keyTokenModel: Model<KeyToken>,
    private readonly encryptionService: EncryptionService,
    private readonly jwtTokenService: JwtTokenService,
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  /**
   * Create or update KeyToken and sync to Redis
   * Handles RSA key generation and encryption of 3rd party token
   */
  async createKeyToken(params: {
    userId: string;
    studentId: string;
    vluteToken: string;
    expiresAt: Date;
    metadata?: Record<string, any>;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    publicKey: string;
  }> {
    const { userId, studentId, vluteToken, expiresAt, metadata } = params;

    // 1. Generate new RSA Key Pair for JWT signing
    const { publicKey, privateKey } =
      this.encryptionService.generateRsaKeyPair();

    // 2. Generate Session Secret for 3rd party token encryption (Split-Secret)
    const sessionSecret = this.encryptionService.generateRandomString(32);
    const nonce = this.encryptionService.generateRandomString(16);

    // 3. Encrypt 3rd party token using Master Key (from env) + Session Secret (from JWT)
    const encryptedResult = this.encryptionService.encryptToken(
      vluteToken,
      sessionSecret,
      nonce,
    );

    // 4. Update or Create KeyToken in MongoDB
    // We maintain a history of the last 3 public keys
    const existingKey = await this.keyTokenModel.findOne({
      user: new Types.ObjectId(userId),
    });

    let publicKeyHistory = existingKey ? [...existingKey.publicKeyHistory] : [];
    publicKeyHistory.unshift(publicKey);
    if (publicKeyHistory.length > 3) {
      publicKeyHistory = publicKeyHistory.slice(0, 3);
    }

    const keyTokenDoc = await this.keyTokenModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      {
        user: new Types.ObjectId(userId),
        student_id: studentId,
        publicKeyHistory,
        encryptedToken: encryptedResult.encryptedData,
        nonce,
        iv: encryptedResult.iv,
        authTag: encryptedResult.authTag,
        expiresAt,
        metadata,
      },
      { upsert: true, new: true },
    );

    // 5. Sync to Redis cache
    await this.syncToRedis(userId, keyTokenDoc);

    // 6. Generate JWT pair
    return this.jwtTokenService.createJwtPair(
      { userId, studentId, sessionSecret },
      privateKey,
      publicKey,
    );
  }

  /**
   * Sync KeyToken document to Redis
   */
  private async syncToRedis(userId: string, doc: KeyToken): Promise<void> {
    const redisKey = `${this.REDIS_KEY_PREFIX}${userId}`;
    await this.redisClient.set(redisKey, JSON.stringify(doc), 'EX', 86400 * 7); // Cache for 7 days
  }

  /**
   * Find KeyToken by UserID (prefer Redis)
   */
  async findByUserId(userId: string): Promise<KeyToken | null> {
    const redisKey = `${this.REDIS_KEY_PREFIX}${userId}`;
    const cached = await this.redisClient.get(redisKey);

    if (cached) {
      return JSON.parse(cached) as KeyToken;
    }

    const doc = await this.keyTokenModel
      .findOne({ user: new Types.ObjectId(userId) })
      .lean();
    if (doc) {
      // Sync back to redis if found in DB but not in redis
      await this.redisClient.set(
        redisKey,
        JSON.stringify(doc),
        'EX',
        86400 * 7,
      );
    }

    return doc as unknown as KeyToken;
  }

  /**
   * Handle Potential Intrusion (Token Reuse)
   * Triggered when an old key (Key 2 or 3) is used for refresh
   */
  async handleIntrusion(userId: string): Promise<void> {
    this.logger.warn(
      `!!! SECURITY ALERT: Potential intrusion detected for user ${userId}. Token reuse or old key detected. !!!`,
    );
    console.error(
      `\x1b[31m[SECURITY ALERT] UNLAWFUL ACCESS ATTEMPT: User ${userId} is attempting to use an outdated or invalid session. Purging all keys.\x1b[0m`,
    );

    // Logout: Clear both DB and Cache
    await this.keyTokenModel.deleteOne({ user: new Types.ObjectId(userId) });
    await this.redisClient.del(`${this.REDIS_KEY_PREFIX}${userId}`);
  }

  /**
   * Remove KeyToken (Logout)
   */
  async removeByUserId(userId: string): Promise<void> {
    await this.keyTokenModel.deleteOne({ user: new Types.ObjectId(userId) });
    await this.redisClient.del(`${this.REDIS_KEY_PREFIX}${userId}`);
  }
}

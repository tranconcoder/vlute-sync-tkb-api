import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as crypto from 'crypto';
import appConfig from '../../configs/app.config';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export interface RsaKeyPair {
  publicKey: string;
  privateKey: string;
}

@Injectable()
export class EncryptionService {
  private readonly aesAlgorithm = 'aes-256-gcm';

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  /**
   * Generate RSA Key Pair (Public/Private)
   */
  generateRsaKeyPair(): RsaKeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    return { publicKey, privateKey };
  }

  /**
   * Derive Encryption Key from Master Key and Session Secret
   * Uses HMAC-SHA256 as KDF
   */
  private deriveKey(sessionSecret: string, nonce: string): Buffer {
    const masterKey = this.config.masterEncryptionKey as string;
    const hmac = crypto.createHmac('sha256', masterKey);
    hmac.update(`${sessionSecret}:${nonce}`);
    return hmac.digest();
  }

  /**
   * Encrypt 3rd Party Token
   * @param token Plain text token
   * @param sessionSecret Secret from JWT (held by Client)
   * @param nonce Random salt (stored in DB)
   */
  encryptToken(
    token: string,
    sessionSecret: string,
    nonce: string,
  ): EncryptionResult {
    const iv = crypto.randomBytes(12);
    const key = this.deriveKey(sessionSecret, nonce);

    const cipher = crypto.createCipheriv(this.aesAlgorithm, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag,
    };
  }

  /**
   * Decrypt 3rd Party Token
   */
  decryptToken(
    encryptedData: string,
    iv: string,
    authTag: string,
    sessionSecret: string,
    nonce: string,
  ): string {
    const key = this.deriveKey(sessionSecret, nonce);
    const decipher = crypto.createDecipheriv(
      this.aesAlgorithm,
      key,
      Buffer.from(iv, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate random string (useful for Nonce or Session Secret)
   */
  generateRandomString(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }
}

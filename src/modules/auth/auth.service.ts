import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { HttpClientService } from '../http-client/http-client.service';
import appConfig from '@/configs/app.config';
import authConfig from './auth.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpClientService: HttpClientService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    @Inject(authConfig.KEY)
    private readonly authConf: ConfigType<typeof authConfig>,
  ) {}

  /**
   * Centralized error handler for the login flow.
   */
  handleGeneralError(error: unknown): never {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[AuthService] Critical Error: ${message}`);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response: {
          status: number;
          headers: Record<string, string | string[] | undefined>;
        };
      };
      console.error('[AuthService] Error Status:', axiosError.response.status);
    }
    throw error;
  }
}

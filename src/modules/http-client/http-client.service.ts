import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import httpClientConfig from './http-client.config';

@Injectable()
export class HttpClientService {
  private readonly instance: AxiosInstance;

  constructor(
    @Inject(httpClientConfig.KEY)
    private config: ConfigType<typeof httpClientConfig>,
  ) {
    this.instance = axios.create({
      baseURL: this.config.vLuteSsoBaseUrl as string,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  get axios(): AxiosInstance {
    return this.instance;
  }

  getBaseUrl(): string {
    return this.config.vLuteSsoBaseUrl as string;
  }
}

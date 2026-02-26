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
   * Step 1: Initiates the SSO flow by calling the auth endpoint and extracting session info.
   *
   * @returns Object containing the final SSO URL and required session cookies
   */
  async initializeSsoSession(
    redirectUri: string = this.authConf.sso.redirectUri.htql,
  ): Promise<{
    ssoUrl: string;
    cookies: string[];
  }> {
    const authUrl = `${this.authConf.sso.authEndpoint}?client_id=${
      this.authConf.sso.clientId
    }&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid`;

    console.log('[AuthService] Fetching initial SSO session (Dynamic)...');

    try {
      const response = await this.httpClientService.axios.get(authUrl, {
        maxRedirects: 5,
        validateStatus: (status) => status === 200 || status === 302,
      });

      let ssoUrl = response.headers.location;
      const cookies = response.headers['set-cookie'] || [];

      if (!ssoUrl && response.data && typeof response.data === 'string') {
        ssoUrl = this.extractSsoUrlFromHtml(response.data);
      }

      if (!ssoUrl) {
        throw new Error('Could not get SSO URL from initial request');
      }

      return { ssoUrl, cookies };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        '[AuthService] Failed to get initial SSO session:',
        errorMessage,
      );
      throw error;
    }
  }

  /**
   * Step 2: Sends a POST request to the SSO authentication endpoint with user credentials.
   *
   * @param email Full student email
   * @param pass Plain text password
   * @param url The dynamic authenticate URL extracted from login form
   * @param cookies The session cookies obtained from initial session
   */
  async authenticate(
    email: string,
    pass: string,
    url: string,
    cookies: string[],
  ) {
    return this.httpClientService.axios.post(
      url,
      new URLSearchParams({
        credentialId: this.authConf.form.credentialId,
        username: email,
        password: pass,
        login: this.authConf.form.loginAction,
      }).toString(),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: cookies.join('; '),
          origin: this.authConf.sso.baseUrl,
          referer: url,
          'user-agent': this.config.userAgent,
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      },
    );
  }

  /**
   * Step 3: Follows the successful login redirect to the application callback URL.
   *
   * @param location The redirect URL provided by SSO
   */
  async consumeCallback(location: string): Promise<{
    status: number;
    success: boolean;
    message: string;
    cookies: string[];
    authCode: string | null;
  }> {
    console.log(
      '[AuthService] Success: Code detected. Swapping for Laravel session...',
    );

    const response = await this.httpClientService.axios.get(location, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302 || status === 200,
      headers: { 'user-agent': this.config.userAgent },
    });

    const finalCookies = response.headers['set-cookie'] || [];
    const hasLaravelSession = finalCookies.some((c) =>
      c.includes('laravel_session'),
    );
    const hasXsrfToken = finalCookies.some((c) => c.includes('XSRF-TOKEN'));

    if (!hasLaravelSession || !hasXsrfToken) {
      console.warn('[AuthService] Missing required Laravel tokens:', {
        hasLaravelSession,
        hasXsrfToken,
      });
      return {
        status: response.status,
        success: false,
        message: 'Could not capture all required session tokens from Laravel',
        cookies: finalCookies,
        authCode: null,
      };
    }

    return {
      status: response.status,
      success: true,
      message: 'Authentication successful',
      cookies: finalCookies,
      authCode: new URL(location).searchParams.get('code'),
    };
  }

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

  /**
   * Parses the SSO login form HTML to find the 'action' attribute.
   */
  private extractSsoUrlFromHtml(html: string): string | undefined {
    const formActionRegex = /<form[^>]+action="([^"]+)"/i;
    const match = html.match(formActionRegex);
    if (match) {
      const url = match[1].replace(/&amp;/g, '&');
      console.log('[AuthService] Found SSO URL in form action');
      return url;
    }
    return undefined;
  }
}

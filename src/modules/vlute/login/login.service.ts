import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { HttpClientService } from '../../http-client/http-client.service';
import appConfig from '@/configs/app.config';
import vluteConfig from '../vlute.config';

import { randomBytes } from 'crypto';

@Injectable()
export class LoginService {
  constructor(
    private readonly httpClientService: HttpClientService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    @Inject(vluteConfig.KEY)
    private readonly authConf: ConfigType<typeof vluteConfig>,
  ) {}

  /**
   * Step 1: Initiates the SSO flow by calling the auth endpoint and extracting session info.
   *
   * @param redirectUri The URI to redirect back to after SSO
   * @param state Optional OIDC state parameter for security
   * @returns Object containing the final SSO URL, required session cookies, and the state used
   */
  async initializeSsoSession(
    redirectUri: string = this.authConf.sso.redirectUri.htql,
    state?: string,
  ): Promise<{
    ssoUrl: string;
    cookies: string[];
    state: string;
  }> {
    const currentState = state || randomBytes(16).toString('hex').slice(0, 40); // Generate a random state if not provided
    const authUrl = `${this.authConf.sso.authEndpoint}?client_id=${
      this.authConf.sso.clientId
    }&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=openid&response_type=code&state=${currentState}`;

    console.log(
      `[VluteLoginService] Fetching initial SSO session with state: ${currentState}`,
    );

    try {
      const response = await this.httpClientService.axios.get(authUrl, {
        maxRedirects: 5,
        validateStatus: (status) => status === 200 || status === 302,
        headers: {
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
          'cache-control': 'max-age=0',
          priority: 'u=0, i',
          'sec-ch-ua':
            '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-site',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          'user-agent': this.config.userAgent,
        },
      });

      let ssoUrl = response.headers.location;
      const cookies = response.headers['set-cookie'] || [];

      if (!ssoUrl && response.data && typeof response.data === 'string') {
        ssoUrl = this.extractSsoUrlFromHtml(response.data);
      }

      if (!ssoUrl) {
        throw new Error('Could not get SSO URL from initial request');
      }

      return { ssoUrl, cookies, state: currentState };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        '[VluteLoginService] Failed to get initial SSO session:',
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
      '[VluteLoginService] Success: Code detected. Swapping for Laravel session...',
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
      console.warn('[VluteLoginService] Missing required Laravel tokens:', {
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
   * Parses the SSO login form HTML to find the 'action' attribute.
   */
  private extractSsoUrlFromHtml(html: string): string | undefined {
    const formActionRegex = /<form[^>]+action="([^"]+)"/i;
    const match = html.match(formActionRegex);
    if (match) {
      const url = match[1].replace(/&amp;/g, '&');
      console.log('[VluteLoginService] Found SSO URL in form action');
      return url;
    }
    return undefined;
  }
}

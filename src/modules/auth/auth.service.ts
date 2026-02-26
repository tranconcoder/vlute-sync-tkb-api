import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { HttpClientService } from '../http-client/http-client.service';
import appConfig from '@/configs/app.config';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpClientService: HttpClientService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  /**
   * Performs the complete login flow:
   * 1. Get initial session from SSO
   * 2. Post credentials to SSO authenticate endpoint
   * 3. Handle redirection to capture Laravel session cookies
   *
   * @param loginDto Standard login credentials (studentId, password)
   * @returns LoginResponseDto containing success status and cookies
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { student_id, password } = loginDto;
    const email = `${student_id}${this.config.studentEmailSuffix}`;

    try {
      // Step 1: Initialize session
      const { ssoUrl, cookies } = await this.getInitialSession();
      console.log(
        `[AuthService] Sequence: 1. Session Init -> 2. SSO Post (${email})`,
      );

      // Step 2: Post credentials to SSO
      const ssoResponse = await this.performSsoLogin(
        email,
        password,
        ssoUrl,
        cookies,
      );
      const location = ssoResponse.headers.location;

      if (!location) {
        return {
          status: ssoResponse.status,
          success: false,
          message:
            'SSO did not provide a redirect location after authentication',
        };
      }

      // Step 3: Handle redirection (Callback or Error)
      if (location.includes('login/callback')) {
        return this.handleLoginSuccess(location);
      }

      return this.handleLoginFailure(ssoResponse.status, location);
    } catch (error: unknown) {
      return this.handleGeneralError(error);
    }
  }

  /**
   * Sends a POST request to the SSO authentication endpoint with user credentials.
   *
   * @param email Full student email
   * @param pass Plain text password
   * @param url The dynamic authenticate URL extracted from login form
   * @param cookies The session cookies obtained from initial session
   */
  private async performSsoLogin(
    email: string,
    pass: string,
    url: string,
    cookies: string[],
  ) {
    return this.httpClientService.axios.post(
      url,
      new URLSearchParams({
        credentialId: '',
        username: email,
        password: pass,
        login: 'login',
      }).toString(),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          cookie: cookies.join('; '),
          origin: 'https://sso.vlute.edu.vn',
          referer: url,
          'user-agent': this.config.userAgent,
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      },
    );
  }

  /**
   * Follows the successful login redirect to the application callback URL.
   *
   * @param location The redirect URL provided by SSO
   */
  private async handleLoginSuccess(
    location: string,
  ): Promise<LoginResponseDto> {
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
   * Handles cases where SSO redirects to an unexpected location.
   *
   * @param status HTTP response status
   * @param location The redirect location
   */
  private handleLoginFailure(
    status: number,
    location: string,
  ): LoginResponseDto {
    console.warn(`[AuthService] Failed: Unexpected redirect to ${location}`);
    return {
      status,
      success: false,
      location,
      message: 'Credentials rejected or session expired at SSO level',
    };
  }

  /**
   * Centralized error handler for the login flow.
   *
   * @param error The unknown error object
   */
  private handleGeneralError(error: unknown): never {
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
   * Initiates the SSO flow by calling the auth endpoint and extracting session info.
   *
   * @returns Object containing the final SSO URL and required session cookies
   */
  private async getInitialSession(): Promise<{
    ssoUrl: string;
    cookies: string[];
  }> {
    const authUrl =
      '/auth/realms/VLUTE/protocol/openid-connect/auth?client_id=vlute.edu.vn&redirect_uri=https://htql.vlute.edu.vn/login/callback&response_type=code&scope=openid';

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
   * Parses the SSO login form HTML to find the 'action' attribute.
   *
   * @param html The HTML content of the login page
   * @returns The extracted URL for the form action
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

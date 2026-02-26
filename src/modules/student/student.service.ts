import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { HttpClientService } from '../http-client/http-client.service';
import appConfig from '@/configs/app.config';

export interface StudentProfile {
  vlute_id: string;
  student_id: string;
  full_name: string;
  email: string;
  date_of_birth?: string;
  class_id?: string;
  class_name?: string;
  major_id?: string;
  major_name?: string;
  avatar?: string;
}

@Injectable()
export class StudentService {
  constructor(
    private readonly httpClientService: HttpClientService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  /**
   * Fetches student profile from VLUTE API using session cookies.
   * @param cookies Laravel session cookies (laravel_session, XSRF-TOKEN)
   */
  async getProfile(cookies: string[]): Promise<StudentProfile> {
    const url = 'https://htql.vlute.edu.vn/api/user-info';

    try {
      const response = await this.httpClientService.axios.get(url, {
        headers: {
          cookie: cookies.join('; '),
          'user-agent': this.config.userAgent,
        },
      });

      const data = response.data;

      // Map API response to our StudentProfile interface
      // Note: Adjust mapping based on actual VLUTE API response structure
      return {
        vlute_id: data.id || data.vlute_id,
        student_id: data.student_id || data.username,
        full_name: data.full_name || data.name,
        email: data.email,
        date_of_birth: data.birthday,
        class_id: data.class_id,
        class_name: data.class_name,
        major_id: data.major_id,
        major_name: data.major_name,
        avatar: data.avatar,
      };
    } catch (error) {
      console.error('[StudentService] Failed to fetch student profile:', error);
      throw error;
    }
  }
}

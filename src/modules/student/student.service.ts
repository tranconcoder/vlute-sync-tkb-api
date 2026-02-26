import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { HttpClientService } from '../http-client/http-client.service';
import appConfig from '@/configs/app.config';
import authConfig from '../auth/auth.config';

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
  avatar?: string | null;
}

interface VluteProfileResponse {
  status: number;
  message: string;
  data: Array<{
    id_sinh_vien: number;
    mssv: number;
    ho_ten: string;
    email: string;
    ngay_sinh: string;
    ma_lop: string;
    ten_lop: string;
    ma_nganh: string;
    ten_nganh: string;
    anh: string | null;
    [key: string]: any;
  }>;
}

@Injectable()
export class StudentService {
  constructor(
    private readonly httpClientService: HttpClientService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    @Inject(authConfig.KEY)
    private readonly authConf: ConfigType<typeof authConfig>,
  ) {}

  /**
   * Fetches student profile from VLUTE API using session cookies.
   * @param cookies Laravel session cookies (laravel_session, XSRF-TOKEN)
   */
  async getProfile(cookies: string[]): Promise<StudentProfile> {
    const url = this.authConf.api.studentProfile;

    const cleanCookies = cookies
      .map((c) => c.split(';')[0])
      .filter((c) => c.trim().length > 0)
      .join('; ');

    try {
      // Use a fresh request to avoid any inherited headers from HttpClientService
      const response = await this.httpClientService.axios.request({
        method: 'GET',
        url: url,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
          Cookie: cleanCookies,
          Referer: this.authConf.api.studentReferer,
          'User-Agent': this.config.userAgent,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      console.log('[StudentService] Status:', response.status);
      const result = response.data as VluteProfileResponse;

      if (result.status !== 200 || !result.data || result.data.length === 0) {
        throw new Error(
          result.message || 'Failed to fetch student profile from VLUTE',
        );
      }

      const data = result.data[0];

      // Map API response to our StudentProfile interface
      return {
        vlute_id: data.id_sinh_vien?.toString(),
        student_id: data.mssv?.toString(),
        full_name: data.ho_ten,
        email: data.email,
        date_of_birth: data.ngay_sinh,
        class_id: data.ma_lop,
        class_name: data.ten_lop,
        major_id: data.ma_nganh,
        major_name: data.ten_nganh,
        avatar: data.anh,
      };
    } catch (error) {
      console.error('[StudentService] Failed to fetch student profile:', error);
      throw error;
    }
  }
}

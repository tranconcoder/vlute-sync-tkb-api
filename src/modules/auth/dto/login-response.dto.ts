export class LoginResponseDto {
  status: number;
  success: boolean;
  message: string;
  cookies?: string[];
  authCode?: string | null;
  location?: string;
}

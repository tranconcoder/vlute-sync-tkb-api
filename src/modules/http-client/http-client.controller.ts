import { Controller } from '@nestjs/common';
import { HttpClientService } from './http-client.service';

@Controller()
export class HttpClientController {
  constructor(private readonly httpClientService: HttpClientService) {}
}

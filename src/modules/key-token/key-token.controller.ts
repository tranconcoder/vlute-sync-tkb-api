import { Controller, Get, Param } from '@nestjs/common';
import { KeyTokenService } from './key-token.service';

@Controller('key-token')
export class KeyTokenController {
  constructor(private readonly keyTokenService: KeyTokenService) {}

  @Get(':userId')
  findByUserId(@Param('userId') userId: string) {
    return this.keyTokenService.findByUserId(userId);
  }
}

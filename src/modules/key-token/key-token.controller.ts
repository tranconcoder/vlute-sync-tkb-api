import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { KeyTokenService } from './key-token.service';
import { CreateKeyTokenDto } from './dto/create-key-token.dto';
import { UpdateKeyTokenDto } from './dto/update-key-token.dto';

@Controller('key-token')
export class KeyTokenController {
  constructor(private readonly keyTokenService: KeyTokenService) {}

  @Post()
  create(@Body() createKeyTokenDto: CreateKeyTokenDto) {
    return this.keyTokenService.create(createKeyTokenDto);
  }

  @Get()
  findAll() {
    return this.keyTokenService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.keyTokenService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateKeyTokenDto: UpdateKeyTokenDto) {
    return this.keyTokenService.update(+id, updateKeyTokenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.keyTokenService.remove(+id);
  }
}

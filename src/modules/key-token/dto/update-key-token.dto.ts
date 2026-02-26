import { PartialType } from '@nestjs/mapped-types';
import { CreateKeyTokenDto } from './create-key-token.dto';

export class UpdateKeyTokenDto extends PartialType(CreateKeyTokenDto) {}

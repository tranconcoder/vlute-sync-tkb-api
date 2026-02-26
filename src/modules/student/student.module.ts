import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StudentService } from './student.service';
import { HttpClientModule } from '../http-client/http-client.module';
import authConfig from '../auth/auth.config';

@Module({
  imports: [HttpClientModule, ConfigModule.forFeature(authConfig)],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}

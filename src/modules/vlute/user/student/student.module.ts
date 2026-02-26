import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StudentService } from './student.service';
import { HttpClientModule } from '../../../http-client/http-client.module';
import vluteConfig from '../../vlute.config';

@Module({
  imports: [HttpClientModule, ConfigModule.forFeature(vluteConfig)],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}

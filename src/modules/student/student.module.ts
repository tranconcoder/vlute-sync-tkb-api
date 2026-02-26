import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { HttpClientModule } from '../http-client/http-client.module';

@Module({
  imports: [HttpClientModule],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}

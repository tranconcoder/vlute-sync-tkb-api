import { Module } from '@nestjs/common';
import { StudentModule } from './student/student.module';

@Module({
  imports: [StudentModule],
  exports: [StudentModule],
})
export class VluteUserModule {}

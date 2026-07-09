import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';
import { PracticeService } from './services/practice.service';
import { PracticeRepository } from './repositories/practice.repository';
import { QuestionSetRepository } from '../question-sets/repositories/question-set.repository';
import { QuestionRepository } from '../questions/repositories/question.repository';

@Module({
  controllers: [PracticeController],
  providers: [PracticeService, PracticeRepository, QuestionSetRepository, QuestionRepository],
  exports: [PracticeService],
})
export class PracticeModule {}

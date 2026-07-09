import { Module } from '@nestjs/common';
import { QuestionSetsService } from './services/question-sets.service';
import { QuestionSetsController } from './question-sets.controller';
import { QuestionSetRepository } from './repositories/question-set.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { TopicsModule } from './topics/topics.module';

@Module({
  imports: [PrismaModule, TopicsModule],
  controllers: [QuestionSetsController],
  providers: [QuestionSetsService, QuestionSetRepository],
  exports: [QuestionSetsService],
})
export class QuestionSetsModule {}

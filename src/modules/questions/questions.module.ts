import { Module } from '@nestjs/common';
import { QuestionsService } from './services/questions.service';
import { QuestionsController } from './questions.controller';
import { QuestionRepository } from './repositories/question.repository';
import { ExplanationFeedbackRepository } from './repositories/explanation-feedback.repository';
import { QuestionSetRepository } from '../question-sets/repositories/question-set.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionRepository, ExplanationFeedbackRepository, QuestionSetRepository],
  exports: [QuestionsService],
})
export class QuestionsModule {}

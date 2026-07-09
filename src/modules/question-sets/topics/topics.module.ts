import { Module } from '@nestjs/common';
import { TopicsService } from './services/topics.service';
import { TopicsController } from './topics.controller';
import { TopicRepository } from './repositories/topic.repository';
import { PrismaModule } from '../../../prisma/prisma.module';
import { QuestionSetRepository } from '../repositories/question-set.repository';

@Module({
  imports: [PrismaModule],
  controllers: [TopicsController],
  providers: [TopicsService, TopicRepository, QuestionSetRepository],
  exports: [TopicsService],
})
export class TopicsModule {}

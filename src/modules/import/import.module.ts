import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImportController } from './import.controller';
import { ImportService } from './services/import.service';
import { ImportProcessor } from './processors/import.processor';
import { ImportJobRepository } from './repositories/import-job.repository';
import { QuestionSetRepository } from '../question-sets/repositories/question-set.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { FileStorageService } from '../../common/services/file-storage.service';
import { getQueueToken } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'import-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    }),
    PrismaModule,
    AiModule,
  ],
  controllers: [ImportController],
  providers: [
    ImportService,
    ImportProcessor,
    ImportJobRepository,
    QuestionSetRepository,
    FileStorageService,
    {
      provide: 'IMPORT_QUEUE',
      useFactory: (queue: any) => queue,
      inject: [getQueueToken('import-queue')],
    },
  ],
  exports: [ImportService],
})
export class ImportModule {}

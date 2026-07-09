import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { FileStorageService } from '../../../common/services/file-storage.service';
import { ImportStatus, ParseStatus } from '@prisma/client';
import { buildQuestionsFromAiResult, TopicMap } from '../import.helper';

@Processor('import-queue')
export class ImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private fileStorage: FileStorageService,
  ) {
    super();
  }

  async process(job: Job<{ importJobId: string }>): Promise<void> {
    const { importJobId } = job.data;
    this.logger.log(`Processing import job: ${importJobId}`);

    try {
      // 1. Get job info
      const importJob = await this.prisma.client.importJob.findUnique({
        where: { id: importJobId },
        include: { questionSet: { include: { topics: true } } },
      });

      if (!importJob) {
        throw new Error(`Import job not found: ${importJobId}`);
      }

      // 2. Update status
      await this.prisma.client.importJob.update({
        where: { id: importJobId },
        data: { status: ImportStatus.processing },
      });

      // 3. Read file
      const fileBuffer = await this.fileStorage.getFile(importJob.fileUrl);

      // 4. Prepare input for AI
      const parseInput = await this.prepareInput(importJob.fileType, fileBuffer, importJob.fileUrl);

      // 5. Call AI - detect mode based on file content
      let result;
      
      if (importJob.fileType === 'text' || importJob.fileUrl.endsWith('.txt')) {
        // Text files: can be either quiz or document
        const textContent = parseInput.data;
        
        // Check if looks like quiz (has question markers like 1. 2. 3. or A) B) C) D))
        const hasQuizMarkers = /^[\s\n]*(1\.|A\)|Question|1\))/m.test(textContent);
        
        if (hasQuizMarkers) {
          // Parse as existing quiz
          this.logger.log(`Mode: Parse existing quiz from text`);
          result = await this.ai.parseDocument(parseInput);
        } else {
          // Generate quiz from document
          this.logger.log(`Mode: Generate quiz from document`);
          result = await this.ai.generateQuizFromDocument(textContent);
        }
      } else {
        // Images/PDF: always parse as existing quiz
        this.logger.log(`Mode: Parse existing quiz from ${importJob.fileType}`);
        result = await this.ai.parseDocument(parseInput);
      }

      // 6. Save to database
      await this.saveParseResult(importJob, result);

      // 7. Mark as done
      const statusToSet = result.questions.length === 0 ? ImportStatus.partial : ImportStatus.done;
      const errorMsg = result.questions.length === 0 
        ? 'Không tìm thấy câu hỏi nào trong file' 
        : null;

      await this.prisma.client.importJob.update({
        where: { id: importJobId },
        data: {
          status: statusToSet,
          parsedCount: result.questions.length,
          failedCount: result.questions.length === 0 ? 1 : 0,
          errorMessage: errorMsg,
          finishedAt: new Date(),
          aiRawResult: result as any,
        },
      });

      await this.prisma.client.questionSet.update({
        where: { id: importJob.questionSetId },
        data: { aiParseStatus: ParseStatus.done },
      });

      this.logger.log(`Import job completed: ${importJobId}, parsed ${result.questions.length} questions`);
    } catch (error) {
      this.logger.error(`Import job failed: ${importJobId}`, error);

      await this.prisma.client.importJob.update({
        where: { id: importJobId },
        data: {
          status: ImportStatus.failed,
          errorMessage: error.message,
          finishedAt: new Date(),
        },
      });

      await this.prisma.client.questionSet.update({
        where: {
          id: (
            await this.prisma.client.importJob.findUnique({
              where: { id: importJobId },
            })
          )?.questionSetId,
        },
        data: { aiParseStatus: ParseStatus.failed },
      });

      throw error;
    }
  }

  private async prepareInput(
    fileType: string,
    buffer: Buffer,
    filepath: string,
  ): Promise<{ type: 'text' | 'image'; mimeType?: string; data: string }> {
    if (fileType === 'image' || filepath.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return {
        type: 'image',
        mimeType: this.getMimeType(filepath),
        data: buffer.toString('base64'),
      };
    }

    if (fileType === 'pdf' || filepath.endsWith('.pdf')) {
      try {
        // For now, just convert to text representation
        return {
          type: 'text',
          data: `[PDF File - ${buffer.length} bytes]`,
        };
      } catch (error) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
    }

    if (fileType === 'text' || filepath.endsWith('.txt')) {
      return {
        type: 'text',
        data: buffer.toString('utf-8'),
      };
    }

    if (fileType === 'docx' || filepath.endsWith('.docx')) {
      // For docx, treat as base64 - Gemini may handle it
      return {
        type: 'text',
        data: buffer.toString('utf-8', 0, Math.min(buffer.length, 5000)), // First 5000 bytes as preview
      };
    }

    return {
      type: 'text',
      data: buffer.toString('utf-8'),
    };
  }

  private getMimeType(filepath: string): string {
    if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg')) return 'image/jpeg';
    if (filepath.endsWith('.png')) return 'image/png';
    if (filepath.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }

  private async saveParseResult(importJob: any, result: any): Promise<void> {
    await this.prisma.client.$transaction(async (tx) => {
      // Build topic map
      const topicMap: TopicMap = {};

      for (const topicName of result.suggestedTopics) {
        const existing = importJob.questionSet.topics.find(
          (t: any) => t.name.toLowerCase() === topicName.toLowerCase(),
        );

        if (existing) {
          topicMap[topicName] = existing.id;
        } else {
          const topic = await tx.topic.create({
            data: {
              questionSetId: importJob.questionSetId,
              name: topicName,
              aiSuggestedName: topicName,
              confirmedByUser: false,
              sortOrder: 0,
            },
          });
          topicMap[topicName] = topic.id;
        }
      }

      // Build and create questions
      const questionsToCreate = buildQuestionsFromAiResult(
        importJob.questionSetId,
        result,
        topicMap,
      );

      for (const q of questionsToCreate) {
        await tx.question.create({
          data: {
            questionSetId: q.questionSetId,
            topicId: q.topicId,
            content: q.content,
            choices: q.choices,
            explanation: q.explanation,
            difficulty: q.difficulty,
            confidenceScore: q.confidenceScore,
            needsReview: q.needsReview,
            sortOrder: q.sortOrder,
          },
        });
      }
    });
  }

}

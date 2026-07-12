import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { QuestionSetRepository } from '../../question-sets/repositories/question-set.repository';
import { FileStorageService } from '../../../common/services/file-storage.service';
import { ImportJobResponseDto } from '../dto/import-job.response.dto';
import { ParseStatus, ImportStatus, ImportFileType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImportService {
  constructor(
    private importJobRepository: ImportJobRepository,
    private questionSetRepository: QuestionSetRepository,
    private fileStorage: FileStorageService,
    @Inject(getQueueToken('import-queue')) private importQueue: Queue,
  ) {}

  async uploadAndCreateJob(
    setId: string,
    userId: string,
    file: Express.Multer.File,
    fileType: ImportFileType,
    generationMode?: string,
  ): Promise<{ importJobId: string; status: ImportStatus }> {
    // 1. Validate set ownership
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền import vào bộ đề này');
    }

    // 2. Validate file
    this.validateFile(file);

    // 3. Save file
    const filename = `${uuidv4()}-${Date.now()}${this.getFileExtension(file.mimetype)}`;
    const filepath = await this.fileStorage.saveFile(filename, file.buffer);

    // 5. Create ImportJob
    const importJob = await this.importJobRepository.create({
      questionSet: { connect: { id: setId } },
      user: { connect: { id: userId } },
      fileType,
      fileUrl: filepath,
      status: ImportStatus.pending,
    });

    // 6. Update QuestionSet status
    await this.questionSetRepository.update(setId, {
      aiParseStatus: ParseStatus.processing,
    });

    // 7. Queue job with generationMode if specified
    const jobData: any = { importJobId: importJob.id };
    if (generationMode) {
      jobData.generationMode = generationMode;
    }
    await this.importQueue.add('parse', jobData);

    return {
      importJobId: importJob.id,
      status: ImportStatus.pending,
    };
  }

  async getJobStatus(setId: string, jobId: string, userId: string): Promise<ImportJobResponseDto> {
    // Verify user owns the set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền xem job này');
    }

    const job = await this.importJobRepository.findById(jobId);
    if (!job || job.questionSetId !== setId) {
      throw new NotFoundException('Import job không tồn tại');
    }

    return this.mapToResponseDto(job);
  }

  async getJobHistory(setId: string, userId: string): Promise<ImportJobResponseDto[]> {
    // Verify user owns the set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền xem lịch sử');
    }

    const jobs = await this.importJobRepository.findBySetId(setId);
    return jobs.map((job) => this.mapToResponseDto(job));
  }

  async deleteJob(setId: string, jobId: string, userId: string): Promise<{ message: string }> {
    // Verify user owns the set
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền xóa job này');
    }

    const job = await this.importJobRepository.findById(jobId);
    if (!job || job.questionSetId !== setId) {
      throw new NotFoundException('Import job không tồn tại');
    }

    // Don't allow deleting active jobs
    if (job.status === ImportStatus.processing || job.status === ImportStatus.pending) {
      throw new ConflictException('Không thể xóa job đang chạy');
    }

    await this.importJobRepository.delete(jobId);

    return { message: 'Import job đã được xóa' };
  }

  async createTextImportJob(
    setId: string,
    userId: string,
    content: string,
  ): Promise<{ importJobId: string; status: ImportStatus }> {
    // Validate set ownership
    const set = await this.questionSetRepository.findById(setId);
    if (!set) {
      throw new NotFoundException('Bộ đề không tồn tại');
    }
    if (set.ownerId !== userId) {
      throw new ForbiddenException('Không có quyền import vào bộ đề này');
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Content cannot be empty');
    }

    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 5000) {
      throw new BadRequestException('Content exceeds 5000 words limit');
    }

    // Create ImportJob for text content
    const importJob = await this.importJobRepository.create({
      questionSet: { connect: { id: setId } },
      user: { connect: { id: userId } },
      fileType: ImportFileType.text,
      fileUrl: 'text-content', // Placeholder
      status: ImportStatus.pending,
    });

    // Update QuestionSet status
    await this.questionSetRepository.update(setId, {
      aiParseStatus: ParseStatus.processing,
    });

    // Queue job with content and force generate mode
    await this.importQueue.add('parse', {
      importJobId: importJob.id,
      textContent: content,
      generationMode: 'generate',
    });

    return {
      importJobId: importJob.id,
      status: ImportStatus.pending,
    };
  }

  private validateFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File không được vượt quá 10MB');
    }

    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Định dạng file không hợp lệ');
    }
  }

  private getFileExtension(mimetype: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    };
    return map[mimetype] || '';
  }

  private mapToResponseDto(job: any): ImportJobResponseDto {
    return {
      id: job.id,
      status: job.status,
      parsedCount: job.parsedCount,
      failedCount: job.failedCount,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      finishedAt: job.finishedAt,
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ImportService } from './services/import.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ImportFileType } from '@prisma/client';

@Controller('question-sets/:setId/import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('file', 10, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
      fileFilter: (req, file, cb) => {
        const allowed = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Định dạng file không hợp lệ'), false);
        }
      },
    }),
  )
  async uploadFiles(
    @Param('setId') setId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Query('fileType') queryFileType?: string,
    @CurrentUser() user?: { id: string },
  ) {
    this.validateUUID(setId);

    if (!files || files.length === 0) {
      throw new BadRequestException('File không được cung cấp');
    }

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Nếu chỉ 1 file, trả về object (backward compatible)
    if (files.length === 1) {
      const file = files[0];
      let fileType = this.getFileType(file.mimetype);
      if (queryFileType && this.isValidFileType(queryFileType)) {
        fileType = queryFileType as ImportFileType;
      }
      return this.importService.uploadAndCreateJob(setId, user.id, file, fileType);
    }

    // Nếu nhiều files, tạo import job cho mỗi file
    const importJobs = await Promise.all(
      files.map(async (file) => {
        let fileType = this.getFileType(file.mimetype);
        if (queryFileType && this.isValidFileType(queryFileType)) {
          fileType = queryFileType as ImportFileType;
        }
        return this.importService.uploadAndCreateJob(setId, user.id, file, fileType);
      }),
    );

    return {
      message: 'Multiple import jobs created',
      count: importJobs.length,
      importJobs,
    };
  }

  @Get(':jobId')
  async getJobStatus(
    @Param('setId') setId: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    this.validateUUID(jobId);
    return this.importService.getJobStatus(setId, jobId, user.id);
  }

  @Get()
  async getJobHistory(
    @Param('setId') setId: string,
    @CurrentUser() user: { id: string },
  ) {
    this.validateUUID(setId);
    return this.importService.getJobHistory(setId, user.id);
  }

  private getFileType(mimetype: string): ImportFileType {
    if (mimetype.startsWith('image/')) return ImportFileType.image;
    if (mimetype === 'application/pdf') return ImportFileType.pdf;
    if (mimetype === 'text/plain') return ImportFileType.text;
    if (
      mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      return ImportFileType.docx;
    return ImportFileType.text;
  }

  private isValidFileType(type: string): boolean {
    return Object.values(ImportFileType).includes(type as ImportFileType);
  }

  private validateUUID(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
  }
}

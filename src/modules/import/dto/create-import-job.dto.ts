import { IsEnum } from 'class-validator';
import { ImportFileType } from '@prisma/client';

export class CreateImportJobDto {
  @IsEnum(ImportFileType, { message: 'Loại file không hợp lệ' })
  fileType: ImportFileType;
}

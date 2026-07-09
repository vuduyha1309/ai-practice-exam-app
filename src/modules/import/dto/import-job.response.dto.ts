import { ImportStatus } from '@prisma/client';

export class ImportJobResponseDto {
  id: string;
  status: ImportStatus;
  parsedCount: number;
  failedCount: number;
  errorMessage: string | null;
  createdAt: Date;
  finishedAt: Date | null;
}

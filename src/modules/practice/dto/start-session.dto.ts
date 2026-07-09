import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { PracticeMode } from '@prisma/client';

export class StartSessionDto {
  @IsUUID()
  questionSetId: string;

  @IsEnum(PracticeMode)
  @IsOptional()
  mode?: PracticeMode = PracticeMode.quick;
}

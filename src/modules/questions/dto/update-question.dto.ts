import { IsOptional, IsString, IsEnum, IsArray, IsUUID } from 'class-validator';
import { DifficultyLevel } from '@prisma/client';
import { Type } from 'class-transformer';

export class ChoiceDto {
  @IsString()
  key: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  contentVi?: string;

  @IsOptional()
  isCorrect?: boolean;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  contentVi?: string;

  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsArray()
  @Type(() => ChoiceDto)
  choices?: ChoiceDto[];
}

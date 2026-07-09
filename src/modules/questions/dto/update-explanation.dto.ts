import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateExplanationDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  regenerate?: boolean;
}

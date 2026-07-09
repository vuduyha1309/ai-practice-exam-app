import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReportExplanationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

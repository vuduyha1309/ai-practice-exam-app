import { IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { VisibilityType, SourceType } from '@prisma/client';

export class CreateQuestionSetDto {
  @IsString()
  @MinLength(1, { message: 'Tiêu đề không được để trống' })
  @MaxLength(200, { message: 'Tiêu đề tối đa 200 ký tự' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Mô tả tối đa 1000 ký tự' })
  description?: string;

  @IsOptional()
  @IsEnum(VisibilityType, { message: 'Loại hiển thị không hợp lệ' })
  visibility?: VisibilityType = VisibilityType.private;

  @IsOptional()
  @IsEnum(SourceType, { message: 'Loại nguồn không hợp lệ' })
  sourceType?: SourceType = SourceType.manual;
}

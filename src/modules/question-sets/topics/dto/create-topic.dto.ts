import { IsString, MinLength, MaxLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @MinLength(1, { message: 'Tên topic không được để trống' })
  @MaxLength(100, { message: 'Tên topic tối đa 100 ký tự' })
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

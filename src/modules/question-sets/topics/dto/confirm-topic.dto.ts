import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class ConfirmTopicDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Tên topic không được để trống' })
  @MaxLength(100, { message: 'Tên topic tối đa 100 ký tự' })
  name?: string;
}

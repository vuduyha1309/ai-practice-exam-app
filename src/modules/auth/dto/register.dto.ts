import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @Matches(/^(\+84|0)[0-9]{9}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  password: string;
}

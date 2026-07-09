import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // email hoặc số điện thoại

  @IsString()
  password: string;
}

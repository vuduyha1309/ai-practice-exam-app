import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './repositories/user.repository';
import { PasswordService } from './services/password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from './entities/user.entity';

interface UserPublicView {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly avatarUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly user: UserPublicView;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Validate inputs
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Tên không được để trống');
    }

    // Validate email format
    this.validateEmail(dto.email);

    // Validate phone format if provided
    if (dto.phone) {
      this.validatePhone(dto.phone);
    }

    // Validate password
    this.validatePassword(dto.password);

    // Check email exists
    const emailExists = await this.userRepository.existsByEmail(dto.email);
    if (emailExists) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Check phone exists
    if (dto.phone) {
      const phoneExists = await this.userRepository.existsByPhone(dto.phone);
      if (phoneExists) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // Create user
    const user = await this.userRepository.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase(),
      phone: dto.phone || null,
      passwordHash,
    });

    // Generate token
    const accessToken = this.generateToken(user.id);

    return {
      accessToken,
      user: this.toPublicView(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    // Validate identifier
    if (!dto.identifier || !dto.identifier.trim()) {
      throw new BadRequestException(
        'Email hoặc số điện thoại không được để trống',
      );
    }

    if (!dto.password) {
      throw new BadRequestException('Mật khẩu không được để trống');
    }

    // Determine if email or phone
    const isEmail = dto.identifier.includes('@');
    const identifier = dto.identifier.trim().toLowerCase();

    let user: UserEntity | null;

    if (isEmail) {
      this.validateEmail(identifier);
      user = await this.userRepository.findByEmail(identifier);
    } else {
      this.validatePhone(identifier);
      user = await this.userRepository.findByPhone(identifier);
    }

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không đúng');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    // Verify password
    const passwordMatch = await this.passwordService.compare(
      dto.password,
      user.passwordHash!,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Thông tin đăng nhập không đúng');
    }

    // Generate token
    const accessToken = this.generateToken(user.id);

    return {
      accessToken,
      user: this.toPublicView(user),
    };
  }

  private generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  private toPublicView(user: UserEntity): UserPublicView {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Email không hợp lệ');
    }
  }

  private validatePhone(phone: string): void {
    const phoneRegex = /^(\+84|0)[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('Số điện thoại không hợp lệ');
    }
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new BadRequestException('Mật khẩu tối thiểu 8 ký tự');
    }
  }
}

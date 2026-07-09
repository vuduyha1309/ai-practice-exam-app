import {
  Controller,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserEntity } from '../auth/entities/user.entity';

interface JwtRequest extends Request {
  user: { id: string };
}

interface UserPublicView {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly avatarUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@Request() req: JwtRequest): Promise<UserPublicView> {
    const userId: string = req.user.id;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicView(user);
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
}


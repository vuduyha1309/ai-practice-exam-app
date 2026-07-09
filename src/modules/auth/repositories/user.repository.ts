import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return new UserEntity({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return new UserEntity({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      passwordHash: user.passwordHash,
    });
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return null;
    }

    return new UserEntity({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      passwordHash: user.passwordHash,
    });
  }

  async create(data: {
    name: string;
    email: string;
    phone: string | null;
    passwordHash: string;
  }): Promise<UserEntity> {
    try {
      const user = await this.prisma.client.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          passwordHash: data.passwordHash,
        },
      });

      return new UserEntity({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        createdAt: user.createdAt,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.client.user.count({
      where: { email },
    });
    return count > 0;
  }

  async existsByPhone(phone: string): Promise<boolean> {
    const count = await this.prisma.client.user.count({
      where: { phone },
    });
    return count > 0;
  }
}

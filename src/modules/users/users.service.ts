import { Injectable } from '@nestjs/common';
import { UserRepository } from '../auth/repositories/user.repository';
import { UserEntity } from '../auth/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findById(id);
  }
}


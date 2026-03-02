import { Inject, Injectable } from '@nestjs/common';
import { User, UserNotFoundException } from '../domain';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';

@Injectable()
export class GetUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async findById(id: bigint): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getById(id: bigint): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }
}

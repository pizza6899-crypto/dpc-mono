import { Inject, Injectable } from '@nestjs/common';
import {
  User,
  UserNotFoundException,
  DuplicatePhoneNumberException,
} from '../domain';
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

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findByPhoneNumber(phoneNumber);
  }

  /**
   * 휴대폰 번호 사용 가능 여부 확인 (본인 제외 타인이 사용 중이면 예외 발생)
   */
  async ensurePhoneNumberAvailable(
    phoneNumber: string,
    excludeUserId?: bigint,
  ): Promise<void> {
    const existingUser = await this.findByPhoneNumber(phoneNumber);
    if (existingUser && existingUser.id !== excludeUserId) {
      throw new DuplicatePhoneNumberException();
    }
  }
}

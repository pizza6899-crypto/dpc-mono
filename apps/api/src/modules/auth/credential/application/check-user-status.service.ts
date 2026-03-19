import { Injectable, Inject } from '@nestjs/common';
import {
  CREDENTIAL_USER_REPOSITORY,
  type CredentialUserRepositoryPort,
} from '../ports/out';

@Injectable()
export class CheckUserStatusService {
  constructor(
    @Inject(CREDENTIAL_USER_REPOSITORY)
    private readonly userRepository: CredentialUserRepositoryPort,
  ) {}

  async execute(userId: bigint): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return !!user;
  }
}

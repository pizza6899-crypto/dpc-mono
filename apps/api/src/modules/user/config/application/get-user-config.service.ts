import { Injectable, Inject } from '@nestjs/common';
import { USER_CONFIG_REPOSITORY } from '../ports/out/user-config.repository.token';
import type { UserConfigRepositoryPort } from '../ports/out/user-config.repository.port';
import { UserConfig } from '../domain/model/user-config.entity';
import { UserConfigNotFoundException } from '../domain/user-config.exception';

@Injectable()
export class GetUserConfigService {
  constructor(
    @Inject(USER_CONFIG_REPOSITORY)
    private readonly userConfigRepository: UserConfigRepositoryPort,
  ) {}

  /**
   * 전역 사용자 설정 정보를 조회합니다.
   */
  async execute(): Promise<UserConfig> {
    const config = await this.userConfigRepository.findConfig();

    if (!config) {
      throw new UserConfigNotFoundException();
    }

    return config;
  }
}

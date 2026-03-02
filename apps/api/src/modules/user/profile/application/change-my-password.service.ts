import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { comparePassword, hashPassword } from 'src/utils/password.util';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { ChangePasswordRequestDto } from '../controllers/user/dto/request/change-password.request.dto';
import { GetUserConfigService } from 'src/modules/user/config/application/get-user-config.service';
import {
  UserNotFoundException,
  IncorrectPasswordException,
  InvalidPasswordException,
  UserException,
} from '../domain';

@Injectable()
export class ChangeMyPasswordService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    private readonly getUserConfigService: GetUserConfigService,
  ) {}

  @Transactional()
  async execute(userId: bigint, dto: ChangePasswordRequestDto): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    // 소셜 로그인 전용 계정인지 확인 (패스워드가 없는 경우)
    if (!user.isPasswordUser() || !user.getAuthInfo().passwordHash) {
      throw new UserException(
        'This account does not have a password to change. (Social login user)',
      );
    }

    // 1. 새 비밀번호 전역 설정(UserConfig)의 정기식 검증 적용
    const config = await this.getUserConfigService.execute();
    if (
      config.passwordRegex &&
      !new RegExp(config.passwordRegex).test(dto.newPassword)
    ) {
      throw new InvalidPasswordException();
    }

    // 2. 기존 비밀번호 검증
    const isPasswordMatch = await comparePassword(
      dto.oldPassword,
      user.getAuthInfo().passwordHash!,
    );

    if (!isPasswordMatch) {
      throw new IncorrectPasswordException();
    }

    // 2. 새 비밀번호 해싱 및 업데이트
    const newPasswordHash = await hashPassword(dto.newPassword);

    await this.userRepository.updatePassword(userId, newPasswordHash);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { comparePassword } from 'src/utils/password.util';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import { RegisterDto } from '../dtos/register.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { UserRoleType, UserStatus } from '@repo/database';
import { RegisterCredentialService } from '../registration/application/register-credential.service';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ACTIVITY_LOG) private readonly activityLog: ActivityLogPort,
    private readonly registerCredentialService: RegisterCredentialService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.role,
    };
  }

  async register(
    registerDto: RegisterDto,
    requestInfo: RequestClientInfo,
  ): Promise<AuthResponseDto> {
    // Registration 모듈을 통해 회원가입 처리
    return await this.registerCredentialService.execute({
      email: registerDto.email!,
      password: registerDto.password,
      referralCode: registerDto.referralCode,
      requestInfo,
    });
  }

  async validateAdmin(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // 관리자 역할 체크
    if (
      user.role !== UserRoleType.ADMIN &&
      user.role !== UserRoleType.SUPER_ADMIN
    ) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.role,
    };
  }
}

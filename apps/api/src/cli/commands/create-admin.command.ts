import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserRoleType, UserStatus, Language } from '@prisma/client';
import { hashPassword } from 'src/utils/password.util';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';
import { IdUtil } from 'src/utils/id.util';

@Injectable()
@Command({
  name: 'admin:create',
  description: '관리자 계정 생성',
})
export class CreateAdminCommand extends CommandRunner {
  private readonly logger = new Logger(CreateAdminCommand.name);

  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const email = options?.email;
    const password = options?.password;
    const role = options?.role || 'ADMIN';
    const country = options?.country || 'KR';
    const language = options?.language || 'KO';

    // 필수 파라미터 검증
    if (!email) {
      this.logger.error('❌ 이메일은 필수입니다. --email 옵션을 사용해주세요.');
      process.exit(1);
    }

    if (!password) {
      this.logger.error(
        '❌ 비밀번호는 필수입니다. --password 옵션을 사용해주세요.',
      );
      process.exit(1);
    }

    // 역할 검증
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      this.logger.error('❌ 역할은 ADMIN 또는 SUPER_ADMIN만 가능합니다.');
      process.exit(1);
    }

    try {
      // 이메일 중복 확인
      const existingUser = await this.prismaService.user.findFirst({
        where: { email },
      });

      if (existingUser) {
        this.logger.error(`❌ 이미 존재하는 이메일입니다: ${email}`);
        process.exit(1);
      }

      this.logger.log(`관리자 계정 생성 시작...`);
      this.logger.log(`이메일: ${email}`);
      this.logger.log(`역할: ${role}`);
      this.logger.log(`국가: ${country}`);
      this.logger.log(`언어: ${language}`);

      // 비밀번호 해싱
      const passwordHash = await hashPassword(password);

      // Whitecliff ID 생성
      const whitecliffId = await IdUtil.generateNextWhitecliffId(
        this.prismaService,
      );
      const whitecliffUsername = `wcf${whitecliffId}`;

      // 타임존 설정
      const timezone = this.getTimezoneByCountry(country);

      // 관리자 계정 생성
      const admin = await this.prismaService.user.create({
        data: {
          email,
          passwordHash,
          role: role as UserRoleType,
          status: UserStatus.ACTIVE,
          country,
          language: language as Language,
          timezone,
          whitecliffId,
          whitecliffUsername,
        },
      });

      this.logger.log(`\n✅ 관리자 계정이 성공적으로 생성되었습니다!`);
      this.logger.log(`ID: ${admin.id}`);
      this.logger.log(`이메일: ${admin.email}`);
      this.logger.log(`역할: ${admin.role}`);
      this.logger.log(`상태: ${admin.status}`);
    } catch (error) {
      this.logger.error('❌ 관리자 계정 생성 실패:', error);
      throw error;
    } finally {
      await this.prismaService.$disconnect();
    }
  }

  private getTimezoneByCountry(country: string): string {
    const timezoneMap: Record<string, string> = {
      KR: 'Asia/Seoul',
      JP: 'Asia/Tokyo',
      US: 'America/New_York',
      CN: 'Asia/Shanghai',
      ID: 'Asia/Jakarta',
      PH: 'Asia/Manila',
      VN: 'Asia/Ho_Chi_Minh',
    };

    return timezoneMap[country] || 'Asia/Seoul';
  }

  @Option({
    flags: '-e, --email <email>',
    description: '관리자 이메일 (필수)',
    required: true,
  })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '-p, --password <password>',
    description: '관리자 비밀번호 (필수)',
    required: true,
  })
  parsePassword(val: string): string {
    return val;
  }

  @Option({
    flags: '-r, --role <role>',
    description: '관리자 역할 (ADMIN 또는 SUPER_ADMIN, 기본값: ADMIN)',
  })
  parseRole(val: string): string {
    return val.toUpperCase();
  }

  @Option({
    flags: '-c, --country <country>',
    description: '국가 코드 (기본값: KR)',
  })
  parseCountry(val: string): string {
    return val.toUpperCase();
  }

  @Option({
    flags: '-l, --language <language>',
    description: '언어 코드 (KO, EN, JA 등, 기본값: KO)',
  })
  parseLanguage(val: string): string {
    return val.toUpperCase();
  }
}

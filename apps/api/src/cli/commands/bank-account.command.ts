import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { ExchangeCurrencyCode } from '@repo/database';

@Injectable()
@Command({
  name: 'bankaccount:seed',
  description: 'BankAccount mockup 데이터 생성',
})
export class BankAccountCommand extends CommandRunner {
  private readonly logger = new Logger(BankAccountCommand.name);

  // 한국 주요 은행명 목록
  private readonly koreanBanks = [
    'KB국민은행',
    '신한은행',
    '우리은행',
    '하나은행',
    'NH농협은행',
    '카카오뱅크',
    '토스뱅크',
    'SC제일은행',
    '한국씨티은행',
    '대구은행',
    '부산은행',
    '경남은행',
    '광주은행',
    '전북은행',
    '제주은행',
    '수협은행',
    '새마을금고',
    '신협',
  ];

  // 예금주명 목록
  private readonly accountHolders = [
    '홍길동',
    '김철수',
    '이영희',
    '박민수',
    '최지영',
    '정수진',
    '강호영',
    '윤서연',
    '장민호',
    '임동욱',
  ];

  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const count = options?.count || 1;
    const currency = options?.currency as ExchangeCurrencyCode | undefined;

    this.logger.log(`BankAccount mockup 데이터 생성 시작...`);
    this.logger.log(`생성 개수: ${count}개`);
    if (currency) {
      this.logger.log(`통화: ${currency}`);
    } else {
      this.logger.log(`통화: 모든 통화 (KRW, USD, JPY, PHP, IDR, VND)`);
    }

    try {
      const currencies = currency
        ? [currency]
        : [
            ExchangeCurrencyCode.KRW,
            ExchangeCurrencyCode.USD,
            ExchangeCurrencyCode.JPY,
            ExchangeCurrencyCode.PHP,
            ExchangeCurrencyCode.IDR,
            ExchangeCurrencyCode.VND,
          ];

      let totalCreated = 0;

      for (const curr of currencies) {
        this.logger.log(`\n${curr} 통화 계좌 생성 중...`);

        for (let i = 0; i < count; i++) {
          const bankAccount = await this.createBankAccount(curr, i);
          this.logger.log(
            `✓ 생성 완료: ${bankAccount.bankName} - ${bankAccount.accountNumber} (${bankAccount.accountHolder})`,
          );
          totalCreated++;
        }
      }

      this.logger.log(
        `\n✅ 총 ${totalCreated}개의 BankAccount가 생성되었습니다.`,
      );
    } catch (error) {
      this.logger.error('❌ BankAccount 생성 실패:', error);
      throw error;
    } finally {
      await this.prismaService.$disconnect();
    }
  }

  private async createBankAccount(
    currency: ExchangeCurrencyCode,
    index: number,
  ) {
    const bankName =
      this.koreanBanks[Math.floor(Math.random() * this.koreanBanks.length)];
    const accountHolder =
      this.accountHolders[
        Math.floor(Math.random() * this.accountHolders.length)
      ];

    // 계좌번호 생성 (은행별 형식 시뮬레이션)
    const accountNumber = this.generateAccountNumber(bankName, index);

    return await this.prismaService.bankAccount.create({
      data: {
        currency,
        bankName,
        accountNumber,
        accountHolder,
        isActive: true,
        priority: index,
        description: `${currency} 통화용 mockup 계좌 #${index + 1}`,
        notes: `CLI로 생성된 테스트 계좌`,
        totalDeposits: 0,
        totalDepositAmount: 0,
      },
    });
  }

  private generateAccountNumber(bankName: string, index: number): string {
    // 은행별로 다른 형식의 계좌번호 생성
    const baseNumber = String(1000000000 + index * 12345);

    // 일부 은행은 하이픈 포함
    if (bankName.includes('KB') || bankName.includes('신한')) {
      return `${baseNumber.slice(0, 3)}-${baseNumber.slice(3, 6)}-${baseNumber.slice(6)}`;
    } else if (bankName.includes('우리') || bankName.includes('하나')) {
      return `${baseNumber.slice(0, 4)}-${baseNumber.slice(4, 8)}-${baseNumber.slice(8)}`;
    } else {
      return baseNumber;
    }
  }

  @Option({
    flags: '-c, --count <count>',
    description: '통화당 생성할 계좌 개수 (기본값: 1)',
  })
  parseCount(val: string): number {
    return parseInt(val, 10);
  }

  @Option({
    flags: '-cur, --currency <currency>',
    description: '생성할 통화 (KRW, USD, JPY, PHP, IDR, VND)',
  })
  parseCurrency(val: string): string {
    return val.toUpperCase();
  }
}

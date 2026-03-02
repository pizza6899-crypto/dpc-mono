import { Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { FindUserWalletService } from '../../wallet/application/find-user-wallet.service';
import { CheckWageringRequirementService } from '../../wagering/requirement/application/check-wagering-requirement.service';
import { WithdrawalEligibilityResponseDto } from '../controllers/user/dto/response/withdrawal-eligibility.response.dto';

export interface GetWithdrawalEligibilityParams {
  userId: bigint;
  currency: ExchangeCurrencyCode;
}

@Injectable()
export class GetWithdrawalEligibilityService {
  constructor(
    private readonly findUserWalletService: FindUserWalletService,
    private readonly checkWageringService: CheckWageringRequirementService,
  ) {}

  /**
   * 유저의 지갑(캐시) 정보와 롤링 정책(Wagering Requirement) 등을 모아,
   * 최종적으로 출금 가능한 투명한 금액(Withdrawable Amount)을 리턴합니다.
   */
  async execute(
    params: GetWithdrawalEligibilityParams,
  ): Promise<WithdrawalEligibilityResponseDto> {
    const { userId, currency } = params;

    // 1. 유저 보유 지갑의 '캐시' 스냅샷 가져오기
    let cashBalance = new Prisma.Decimal(0);
    const wallet = await this.findUserWalletService.findWallet(
      userId,
      currency,
    );
    if (wallet) {
      cashBalance = wallet.cash; // 본 현금
    }

    // 2. 롤링(Wagering) 및 출금 제재 상태 확인
    const wageringSummary = await this.checkWageringService.getSummary(
      userId,
      currency,
    );

    const isWithdrawalRestricted = wageringSummary.isRestricted;
    let withdrawableAmount = cashBalance.toString();

    // 제재되어 있다면 출금액은 0원으로 떨어짐
    if (isWithdrawalRestricted) {
      withdrawableAmount = '0.00';
      // (향후 KYC 미완료 등 다른 제재 사유가 있다면 여기서 withdrawableAmount를 0으로 처리)
    }

    return {
      currency,
      withdrawableAmount,
    };
  }
}

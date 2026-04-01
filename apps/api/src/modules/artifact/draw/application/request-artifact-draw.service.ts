import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { RequestContextService } from 'src/infrastructure/cls/request-context.service';
import { ArtifactDrawType, ArtifactDrawPaymentType, ArtifactGrade, ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { SolanaService } from 'src/infrastructure/blockchain/solana/solana.service';
import { AdvisoryLockService } from 'src/infrastructure/concurrency/advisory-lock.service';
import { LockNamespace } from 'src/infrastructure/concurrency/concurrency.constants';
import { UserArtifactStatusRepositoryPort } from '../../status/ports/user-artifact-status.repository.port';
import { ArtifactPolicyRepositoryPort } from '../../master/ports/artifact-policy.repository.port';
import { ArtifactDrawRequestRepositoryPort } from '../ports/artifact-draw-request.repository.port';
import { ArtifactDrawRequest } from '../domain/artifact-draw-request.entity';
import { ArtifactStatusNotFoundException } from '../../status/domain/status.exception';
import { ArtifactPolicyNotFoundException } from '../../master/domain/master.exception';
import { ArtifactDrawPriceNotFoundException, CurrencyCodeRequiredException } from '../domain/draw.exception';
import { ProcessWageringBetService } from 'src/modules/wagering/engine/application/process-wagering-bet.service';
import { WalletActionName } from 'src/modules/wallet/domain';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';

export interface RequestDrawCommand {
  drawType: ArtifactDrawType;
  paymentType: ArtifactDrawPaymentType;
  ticketType?: ArtifactGrade | 'ALL';
}

/**
 * [Artifact Draw] 유물 뽑기 신청 서비스 (Commit 단계)
 */
@Injectable()
export class RequestArtifactDrawService {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly solanaService: SolanaService,
    private readonly lockService: AdvisoryLockService,
    private readonly userStatusRepo: UserArtifactStatusRepositoryPort,
    private readonly policyRepo: ArtifactPolicyRepositoryPort,
    private readonly drawRequestRepo: ArtifactDrawRequestRepositoryPort,
    private readonly wageringBetService: ProcessWageringBetService,
    private readonly exchangeRateService: ExchangeRateService,
  ) { }

  @Transactional()
  async execute(command: RequestDrawCommand): Promise<ArtifactDrawRequest> {
    const userId = this.requestContext.getUserId()!;
    const { drawType, paymentType, ticketType } = command;
    const currencyCode = this.requestContext.getPlayCurrency();

    // 1. 동시성 제어 (유저별 락)
    await this.lockService.acquireLock(LockNamespace.ARTIFACT_DRAW, userId.toString());

    // 2. 유저 상태 확인
    const userStatus = await this.userStatusRepo.findByUserId(userId);
    if (!userStatus) {
      throw new ArtifactStatusNotFoundException();
    }

    // 3. 미래 슬롯(targetSlot) 결정 (Commit -> Reveal 간격)
    const currentSlot = await this.solanaService.getCurrentSlot();
    const targetSlot = BigInt(currentSlot + 4); // 약 1.6~2.4초 뒤 (Commit -> Reveal 간격 단축)

    // 4. 뽑기 요청 생성 및 저장 (PENDING)
    let drawRequest = ArtifactDrawRequest.create({
      userId,
      targetSlot,
      drawType,
      paymentType,
      ticketType: ticketType || null,
      currencyCode: currencyCode || null,
    });
    drawRequest = await this.drawRequestRepo.save(drawRequest);

    // 5. 결제 처리 (티켓 또는 재화)
    const spendCount = drawType === 'SINGLE' ? 1 : 10;

    if (paymentType === ArtifactDrawPaymentType.TICKET) {
      const type = (ticketType || 'ALL') as any;
      userStatus.spendTickets(type, spendCount);
    } else {
      if (!currencyCode) {
        throw new CurrencyCodeRequiredException();
      }

      const policy = await this.policyRepo.findPolicy();
      if (!policy) {
        throw new ArtifactPolicyNotFoundException();
      }

      const price = policy.getDrawPrice(drawType, currencyCode);
      if (!price) {
        throw new ArtifactDrawPriceNotFoundException(currencyCode);
      }

      // [GAMIFICATION FIX] 사용된 게임재화를 기반으로 USD 환율 획득 (경험치, 콤프 정산용)
      const usdExchangeRate = await this.exchangeRateService.getRate({
        fromCurrency: currencyCode,
        toCurrency: ExchangeCurrencyCode.USD,
      });

      // [Wagering Integration]
      // 웨이저링 베트 처리 (재화 차감, 롤링/콤프 적용, XP 지급)
      await this.wageringBetService.execute({
        userId,
        currency: currencyCode,
        betAmount: price,
        exchangeRate: new Prisma.Decimal(1), // 유물 가챠는 전용 게임 재화가 없으므로 1:1 디폴트
        usdExchangeRate: usdExchangeRate,
        referenceId: drawRequest.id,
        actionName: WalletActionName.ARTIFACT_DRAW,
        metadata: {
          requestId: String(drawRequest.id),
          description: '유물 뽑기 베팅',
        },
      });

      // 유통 통계 기록
      userStatus.recordCurrencyDraw(spendCount);
    }

    // 상태 업데이트 (티켓 차감 등)
    await this.userStatusRepo.update(userStatus);

    return drawRequest;
  }
}

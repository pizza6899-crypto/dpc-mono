import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { RequestContextService } from 'src/infrastructure/cls/request-context.service';
import { ArtifactDrawType, ArtifactDrawPaymentType, ArtifactGrade, ExchangeCurrencyCode } from '@prisma/client';
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

export interface RequestDrawCommand {
  drawType: ArtifactDrawType;
  paymentType: ArtifactDrawPaymentType;
  ticketType?: ArtifactGrade | 'ALL';
  currencyCode?: ExchangeCurrencyCode;
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
  ) { }

  @Transactional()
  async execute(command: RequestDrawCommand): Promise<ArtifactDrawRequest> {
    const userId = this.requestContext.getUserId()!;
    const { drawType, paymentType, ticketType, currencyCode } = command;

    // 1. 동시성 제어 (유저별 락)
    await this.lockService.acquireLock(LockNamespace.ARTIFACT_DRAW, userId.toString());

    // 2. 유저 상태 확인
    const userStatus = await this.userStatusRepo.findByUserId(userId);
    if (!userStatus) {
      throw new ArtifactStatusNotFoundException();
    }

    // 3. 결제 처리 (티켓 또는 재화)
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

      // 유통 통계 기록
      userStatus.recordCurrencyDraw(spendCount);

      // TODO: WalletService.debit(userId, currencyCode, price) 실제 지갑 차감 로직 연동 필요
      console.log(`[PAYMENT] User ${userId} paid ${price} ${currencyCode} for ${drawType} draw`);
    }

    // 상태 업데이트 (티켓 차감 등)
    await this.userStatusRepo.update(userStatus);

    // 4. 미래 슬롯(targetSlot) 결정
    // 현재 슬롯보다 10~20 슬롯 정도 앞선 블록을 대상으로 지정 (Commit -> Reveal 간격)
    const currentSlot = await this.solanaService.getCurrentSlot();
    const targetSlot = BigInt(currentSlot + 10); // 약 4~6초 뒤

    // 5. 뽑기 요청 생성 및 저장 (PENDING)
    const drawRequest = ArtifactDrawRequest.create({
      userId,
      targetSlot,
      drawType,
      paymentType,
      ticketType: ticketType || null,
      currencyCode: currencyCode || null,
    });

    return await this.drawRequestRepo.save(drawRequest);
  }
}

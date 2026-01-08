// src/modules/deposit/application/reject-deposit.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { DEPOSIT_DETAIL_REPOSITORY } from '../ports/out';
import type { DepositDetailRepositoryPort } from '../ports/out';
import type { RequestClientInfo } from 'src/common/http/types';
import {
  DepositNotFoundException,
  DepositAlreadyProcessedException,
} from '../domain';

interface RejectDepositParams {
  id: bigint;
  failureReason: string;
  adminId: bigint;
  requestInfo: RequestClientInfo;
}

interface RejectDepositResult {
  userId: string;
}

@Injectable()
export class RejectDepositService {
  private readonly logger = new Logger(RejectDepositService.name);

  constructor(
    @Inject(DEPOSIT_DETAIL_REPOSITORY)
    private readonly depositRepository: DepositDetailRepositoryPort,
  ) { }

  @Transactional()
  async execute(params: RejectDepositParams): Promise<RejectDepositResult> {
    const { id, failureReason, adminId } = params;

    // 락 획득 (DB Advisory Lock)
    await this.depositRepository.acquireDepositLock(id);

    // 1. DepositDetail 조회
    const deposit = await this.depositRepository.getById(id, {
      transaction: true,
    });

    // 2. 엔티티 비즈니스 로직 실행 (거부 처리)
    deposit.reject(failureReason, adminId);

    // 3. 만약 이미 트랜잭션이 있다면 상태 업데이트 (취소 처리)
    // Note: 지연 생성 정책에 따라 보통은 없을 것이나, 시스템 일관성을 위해 체크
    if (deposit.transactionId) {
      // TODO: Transaction 상태 업데이트 로직 (Repository 메서드 필요할 수 있음)
      // 현재는 Repository에 트랜잭션 업데이트 메서드가 없으므로 생략하거나 추가
    }

    // 4. DepositDetail 상태 업데이트
    await this.depositRepository.update(deposit);

    return {
      userId: deposit.userId.toString(),
    };
  }
}


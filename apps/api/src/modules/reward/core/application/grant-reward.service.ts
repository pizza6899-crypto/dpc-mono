// src/modules/reward/core/application/grant-reward.service.ts
import { Injectable, Inject } from '@nestjs/common';
import {
  ExchangeCurrencyCode,
  RewardItemType,
  RewardSourceType,
  WageringTargetType,
} from '@prisma/client';
import Decimal from 'decimal.js';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import {
  type IRewardRepository,
  REWARD_REPOSITORY,
} from '../ports/reward.repository.port';
import { UserReward } from '../domain/reward.entity';
import { RewardMetadata } from '../domain/reward.types';

export interface GrantRewardCommand {
  userId: bigint;
  sourceType: RewardSourceType;
  sourceId?: bigint;
  rewardType: RewardItemType;
  currency: ExchangeCurrencyCode;
  amount: Decimal;
  wageringTargetType?: WageringTargetType;
  wageringMultiplier?: Decimal;
  wageringExpiryDays?: number;
  maxCashConversion?: Decimal;
  isForfeitable?: boolean;
  expiresAt?: Date;
  metadata?: RewardMetadata;
  reason?: string;
}

@Injectable()
export class GrantRewardService {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
    private readonly snowflakeService: SnowflakeService,
  ) {}

  /**
   * 신규 보상(쿠폰)을 유저에게 발급합니다.
   * (예: 어드민이 CS로 지급, 콤프 스케줄러가 지급 등)
   */
  async execute(command: GrantRewardCommand): Promise<UserReward> {
    // 1. 고유 Snowflake ID 및 해당 ID에 묶인 시간 발급
    const { id, timestamp } = this.snowflakeService.generate();

    // 2. 파라미터를 기반으로 PENDING 상태의 신규 보상 모델(Entity) 조립
    const reward = UserReward.create({
      id,
      userId: command.userId,
      sourceType: command.sourceType,
      sourceId: command.sourceId,
      rewardType: command.rewardType,
      currency: command.currency,
      amount: command.amount,
      wageringTargetType: command.wageringTargetType,
      wageringMultiplier: command.wageringMultiplier,
      wageringExpiryDays: command.wageringExpiryDays,
      maxCashConversion: command.maxCashConversion,
      isForfeitable: command.isForfeitable,
      expiresAt: command.expiresAt,
      metadata: command.metadata,
      reason: command.reason,
      createdAt: timestamp,
    });

    // 3. 데이터베이스 영속성 보장
    const savedReward = await this.rewardRepository.save(reward);

    // (선택) 여기에 유저 푸시 알림/웹소켓 이벤트 발송 로직 추가 가능
    // this.eventEmitter.emit('reward.granted', { userId: command.userId, rewardId: id });

    return savedReward;
  }
}

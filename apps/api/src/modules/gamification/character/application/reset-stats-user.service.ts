import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CharacterLogType, UserWalletTransactionType, UserWalletBalanceType } from '@prisma/client';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { GetGamificationConfigService } from '../../catalog/application/get-gamification-config.service';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import { FindUserCharacterService } from './find-user-character.service';
import {
  USER_CHARACTER_REPOSITORY_PORT,
  USER_CHARACTER_LOG_REPOSITORY_PORT,
} from '../ports';
import type {
  UserCharacterRepositoryPort,
  UserCharacterLogRepositoryPort
} from '../ports';
import { UserCharacter } from '../domain/user-character.entity';
import { UserCharacterLog } from '../domain/user-character-log.entity';

@Injectable()
export class ResetStatsUserService {
  constructor(
    @Inject(USER_CHARACTER_REPOSITORY_PORT)
    private readonly characterRepo: UserCharacterRepositoryPort,
    @Inject(USER_CHARACTER_LOG_REPOSITORY_PORT)
    private readonly logRepo: UserCharacterLogRepositoryPort,
    private readonly getConfigService: GetGamificationConfigService,
    private readonly userBalanceService: UpdateUserBalanceService,
    private readonly findUserCharacterService: FindUserCharacterService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  /**
   * 유저가 비용을 지불하고 캐릭터 스탯을 초기화합니다.
   */
  @Transactional()
  async execute(userId: bigint): Promise<UserCharacter> {
    // 1. 유저별 캐릭터 뮤테이션 권고락 획득
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAMIFICATION_CHARACTER,
      userId.toString(),
    );

    const character = await this.findUserCharacterService.execute(userId);
    const config = await this.getConfigService.execute();

    const beforeLevel = character.level;
    const beforeStatPoints = character.statPoints;

    // 2. 비용 지불 처리 (설정된 가격이 0원보다 크다면 지갑에서 차감)
    if (config.statResetPrice.gt(0)) {
      await this.userBalanceService.updateBalance(
        {
          userId: character.userId,
          currency: config.statResetCurrency,
          amount: config.statResetPrice,
          operation: UpdateOperation.SUBTRACT,
          balanceType: UserWalletBalanceType.CASH,
          transactionType: UserWalletTransactionType.ADJUSTMENT,
        },
        {
          actionName: WalletActionName.ADMIN_ADJUSTMENT, // 기성 액션 활용 혹은 기타
          internalNote: 'Gamification Character Stat Reset Fee',
        },
      );
    }

    // 3. 도메인 로직 실행 (스탯 초기화 및 포인트 반환)
    character.resetStats();

    // 4. 변경 사항 저장
    await this.characterRepo.save(character);

    // 5. 로그 기록
    const log = UserCharacterLog.create({
      userId: character.userId,
      type: CharacterLogType.STAT_RESET,
      beforeLevel,
      afterLevel: character.level,
      beforeStatPoints,
      afterStatPoints: character.statPoints,
      details: {
        reason: 'USER_PAID_RESET',
        price: config.statResetPrice.toString(),
        currency: config.statResetCurrency,
      },
    });

    await this.logRepo.save(log);

    return character;
  }
}

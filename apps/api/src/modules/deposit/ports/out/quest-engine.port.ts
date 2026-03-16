import { Prisma, ExchangeCurrencyCode } from '@prisma/client';

export const QUEST_ENGINE_PORT = Symbol('QUEST_ENGINE_PORT');

export interface ProcessDepositQuestCommand {
  userId: bigint;
  depositId: bigint;
  questId: bigint;
  actuallyPaid: Prisma.Decimal;
  currency: ExchangeCurrencyCode;
}

export interface QuestProcessResult {
  isSatisfied: boolean;
  userQuestId?: bigint;
  rewardAmount?: Prisma.Decimal;
  wageringMultiplier?: Prisma.Decimal;
}

export interface ValidateQuestEligibilityCommand {
  userId: bigint;
  questId: bigint;
  currency: ExchangeCurrencyCode;
  amount?: Prisma.Decimal; // 신청 시점의 예상 금액 (선택 사항)
}

export interface QuestEnginePort {
  /**
   * 퀘스트 자격을 검증하고, 조건 충족 여부와 보상 정보를 계산합니다.
   * 실제 잔액 및 웨이저링 업데이트는 호출자가 수행합니다.
   * 
   * @param command 처리 요청 정보
   * @returns 퀘스트 처리 결과 (보상 금액 및 롤링 배수 포함)
   */
  processDepositQuest(command: ProcessDepositQuestCommand): Promise<QuestProcessResult>;

  /**
   * 입금 신청 시점에 선택한 퀘스트가 유효한지 검증합니다.
   * 
   * @param command 검증 요청 정보
   * @returns 유효 여부 (true: 자격 있음, false: 자격 없음)
   */
  validateQuestEligibility(command: ValidateQuestEligibilityCommand): Promise<boolean>;
}

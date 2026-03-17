// src/modules/promotion/domain/promotion.constants.ts
import { Prisma } from '@prisma/client';

/**
 * 프로모션에 참여하지 않은 일반 입금 시 적용되는 기본 AML 롤링 배수
 * (현재 고정 상수로 관리하며, 향후 DB 설정으로 이전될 수 있습니다.)
 */
export const DEFAULT_AML_DEPOSIT_MULTIPLIER = new Prisma.Decimal(1.0);

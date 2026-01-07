// src/utils/id.util.ts
import { init } from '@paralleldrive/cuid2';
import { customAlphabet } from 'nanoid';
import type { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { nowUtc } from './date.util';
import type { Prisma } from '@repo/database';

// 디폴트 설정으로 한 번만 초기화 (성능 최적화)
const generateId = init();

export class IdUtil {
  /**
   * CUID2 기반 고유 ID 생성
   * @description 프로젝트 전역에서 사용하는 기본 UID 생성 함수
   * @returns {string} CUID2 형식의 고유 ID
   * @example
   * const userId = IdUtil.generateUid();
   * const orderId = IdUtil.generateUid();
   */
  static generateUid(): string {
    return generateId();
  }

  /**
   * CUID2 생성
   * @deprecated generateUid()를 사용하세요. 하위 호환성을 위해 유지됩니다.
   */
  static generateCuid(): string {
    return generateId();
  }

  /**
   * 세션 ID 생성 (CUID2 기반)
   */
  static generateSessionId(): string {
    return generateId();
  }

  /**
   * nanoid 커스텀 알파벳 생성
   */
  static generateNanoidWithAlphabet(alphabet: string, length: number): string {
    const customNanoid = customAlphabet(alphabet, length);
    return customNanoid();
  }

  /**
   * 영문 대소문자와 숫자만 포함된 nanoid 생성 (URL 안전)
   */
  static generateUrlSafeNanoid(length: number = 21): string {
    const urlSafeAlphabet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return this.generateNanoidWithAlphabet(urlSafeAlphabet, length);
  }

  /**
   * 데이터베이스에서 가장 큰 whitecliffId + 1 값 생성
   */
  static async generateNextWhitecliffId(
    prisma: PrismaService | Prisma.TransactionClient,
  ): Promise<bigint> {
    // 가장 큰 whitecliffId 값 조회
    const maxIdResult = await prisma.user.findFirst({
      where: {
        whitecliffId: { not: null },
      },
      orderBy: {
        whitecliffId: 'desc',
      },
      select: {
        whitecliffId: true,
      },
    });

    // 기존 값이 없으면 1부터 시작, 있으면 +1
    const nextId = maxIdResult?.whitecliffId
      ? maxIdResult.whitecliffId + BigInt(1)
      : BigInt(1);

    return nextId;
  }

  static async generateNextDcsId(
    prisma: PrismaService | Prisma.TransactionClient,
  ): Promise<string> {
    // 가장 큰 dcsId 값 조회
    const maxIdResult = await (prisma as PrismaService).user.findFirst({
      where: {
        dcsId: { not: null },
      },
      orderBy: {
        dcsId: 'desc',
      },
      select: {
        dcsId: true,
      },
    });

    // 기존 값이 없으면 1부터 시작
    if (!maxIdResult?.dcsId) {
      return 'dcs1';
    }

    // dcsId에서 숫자 부분만 추출 (예: "dcs123" -> 123)
    const match = maxIdResult.dcsId.match(/^dcs(\d+)$/);
    if (!match) {
      // 형식이 맞지 않으면 1부터 시작
      return 'dcs1';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `dcs${nextNumber}`;
  }

  static generateCryptoOrderId(): string {
    const unixTime = Math.floor(nowUtc().getTime() / 1000).toString(); // 10자리
    const nanoid = this.generateUrlSafeNanoid(4);
    return `${unixTime}${nanoid}`;
  }
}

/**
 * CUID2 기반 고유 ID 생성 함수
 * @description IdUtil.generateUid()의 간편한 별칭
 * @returns {string} CUID2 형식의 고유 ID
 * @example
 * import { generateUid } from 'src/utils/id.util';
 * const userId = generateUid();
 */
export function generateUid(): string {
  return generateId();
}

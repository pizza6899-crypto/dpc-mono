/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  ⚠️⚠️⚠️  CRITICAL WARNING - DO NOT MODIFY THIS FILE  ⚠️⚠️⚠️                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  이 파일에는 Sqids 인코딩/디코딩의 핵심 상수와 알고리즘이 포함되어 있습니다.     ║
 * ║  아래 항목들을 수정하면 기존에 생성된 모든 Sqid를 복구할 수 없습니다:           ║
 * ║                                                                               ║
 * ║  1. KNUTH_PRIME, KNUTH_INVERSE, KNUTH_MASK - Knuth 해시 상수                   ║
 * ║  2. DJB2_INIT_HASH, MULBERRY32_INCREMENT - 해시/PRNG 상수                      ║
 * ║  3. hashString(), mulberry32(), shuffleAlphabet() - 알고리즘 함수              ║
 * ║                                                                               ║
 * ║  🚨 서비스 운영 중에는 절대로 이 값들을 변경하지 마세요!                        ║
 * ║  🚨 변경 시 모든 기존 URL, 링크, 저장된 ID가 무효화됩니다!                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Sqid와 접두사 사이의 구분자
 */
export const SQIDS_DELIMITER = '_';

/**
 * Sqids 인코딩 시 사용할 접두사 라벨 정의
 *
 * 새 prefix 추가는 안전하지만, 기존 prefix 값 변경은 금지됩니다.
 */
export const SqidsPrefix = {
  USER: 'u',
  DEPOSIT: 'd',
  WITHDRAWAL: 'w',
  WALLET_TRANSACTION: 'wtx',
  AFFILIATE_CODE: 'ac',
  USER_TIER: 'ut',
  TIER: 't',
  CASINO_GAME: 'cg',
  WAGERING_REQUIREMENT: 'wr',
  PROMOTION: 'p',
  USER_PROMOTION: 'up',
  WITHDRAW_BANK_CONFIG: 'wbc',
  WITHDRAW_CRYPTO_CONFIG: 'wcc',
  COMMISSION: 'com',
  COM_WALLET: 'cw',
  COM_TRANSACTION: 'ctx',
  INBOX: 'i',
  FILE: 'f',
  USER_TIER_HISTORY: 'uth',
  TIER_REWARD: 'tr',
  REWARD: 'r',
  CHAT_ROOM: 'cr',
  // 필요에 따라 추가 (기존 값 수정 금지)
} as const;

export type SqidsPrefixType = (typeof SqidsPrefix)[keyof typeof SqidsPrefix];

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 IMMUTABLE CRYPTOGRAPHIC CONSTANTS - 절대 수정 금지
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Knuth's Multiplicative Hash (64-bit)를 위한 상수
 * 자동 증가 정수(Sequential ID)를 비트 공간상에 무작위로 재배치하여 추측을 불가능하게 합니다.
 *
 * ⚠️ IMMUTABLE: 이 값들을 변경하면 기존에 생성된 모든 Sqid를 디코딩할 수 없게 됩니다.
 */
export const KNUTH_PRIME = 6364136223846793005n;
export const KNUTH_INVERSE = 13877824140714322085n;
export const KNUTH_MASK = (1n << 64n) - 1n;

/**
 * DJB2 해시 알고리즘 초기값
 *
 * ⚠️ IMMUTABLE: 변경 시 prefix별 alphabet 셔플 결과가 달라져 모든 Sqid가 무효화됩니다.
 */
export const DJB2_INIT_HASH = 5381;

/**
 * Mulberry32 PRNG 증분값
 *
 * ⚠️ IMMUTABLE: 변경 시 prefix별 alphabet 셔플 결과가 달라져 모든 Sqid가 무효화됩니다.
 */
export const MULBERRY32_INCREMENT = 0x6d2b79f5;

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 IMMUTABLE ALGORITHM FUNCTIONS - 절대 수정 금지
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 문자열을 32비트 정수 해시로 변환 (djb2 알고리즘)
 *
 * ⚠️ IMMUTABLE ALGORITHM
 * 이 함수의 로직을 변경하면 모든 prefix별 alphabet 매핑이 깨집니다.
 * 기존에 인코딩된 모든 Sqid 값을 디코딩할 수 없게 됩니다.
 *
 * @param str 해시할 문자열 (보통 prefix 값)
 * @returns 32비트 unsigned 정수 해시값
 */
export function hashString(str: string): number {
  let hash = DJB2_INIT_HASH;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // unsigned 32-bit
}

/**
 * Seeded PRNG (Mulberry32) - 결정론적 난수 생성기
 *
 * ⚠️ IMMUTABLE ALGORITHM
 * 이 함수의 로직을 변경하면 모든 prefix별 alphabet 매핑이 깨집니다.
 * 기존에 인코딩된 모든 Sqid 값을 디코딩할 수 없게 됩니다.
 *
 * @param seed 초기 시드값
 * @returns 0~1 사이의 난수를 생성하는 함수
 */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += MULBERRY32_INCREMENT);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates 셔플 (결정론적, seeded PRNG 사용)
 * prefix를 기반으로 alphabet을 결정론적으로 셔플합니다.
 *
 * ⚠️ IMMUTABLE ALGORITHM
 * 이 함수의 로직을 변경하면 모든 prefix별 alphabet 매핑이 깨집니다.
 * 기존에 인코딩된 모든 Sqid 값을 디코딩할 수 없게 됩니다.
 *
 * @param alphabet 기본 알파벳 문자열
 * @param prefix prefix 값 (seed로 사용)
 * @returns 결정론적으로 셔플된 알파벳 문자열
 */
export function shuffleAlphabet(alphabet: string, prefix: string): string {
  const seed = hashString(prefix);
  const chars = alphabet.split('');
  const random = mulberry32(seed);

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

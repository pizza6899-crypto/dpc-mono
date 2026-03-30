import { Injectable } from '@nestjs/common';
import Sqids from 'sqids';
import { EnvService } from 'src/infrastructure/env/env.service';
import {
  SQIDS_DELIMITER,
  SqidsPrefixType,
  SqidsPrefix,
  KNUTH_PRIME,
  KNUTH_INVERSE,
  KNUTH_MASK,
  shuffleAlphabet,
} from './sqids.constants';
import {
  InvalidSqidFormatException,
  InvalidSqidIdException,
} from './sqids.exception';

@Injectable()
export class SqidsService {
  private readonly sqidsCache: Map<string, Sqids> = new Map();
  private readonly baseAlphabet: string;
  private readonly minLength: number;

  constructor(private readonly envService: EnvService) {
    const { alphabet, minLength } = this.envService.sqids;
    this.baseAlphabet = alphabet;
    this.minLength = minLength;
  }

  /**
   * prefix에 대한 Sqids 인스턴스를 가져옵니다. (캐싱)
   * 각 prefix는 고유한 셔플된 alphabet을 사용합니다.
   * @param prefix SqidsPrefix 상수에 정의된 접두사 라벨 (선택 사항)
   * @returns Sqids 인스턴스
   */
  private getSqidsInstance(prefix?: SqidsPrefixType): Sqids {
    const cacheKey = prefix || 'default';
    if (this.sqidsCache.has(cacheKey)) {
      return this.sqidsCache.get(cacheKey)!;
    }

    let alphabetToUse = this.baseAlphabet;
    if (prefix) {
      alphabetToUse = shuffleAlphabet(this.baseAlphabet, prefix);
    }

    const sqidsInstance = new Sqids({
      alphabet: alphabetToUse,
      minLength: this.minLength,
    });
    this.sqidsCache.set(cacheKey, sqidsInstance);
    return sqidsInstance;
  }

  /**
   * ID를 Sqid 문자열로 인코딩합니다.
   * Knuth's Multiplicative Hash를 적용하여 순차적 ID를 난독화한 후 Sqid로 변환합니다.
   *
   * @param id 인코딩할 ID (number | bigint, 양수만 허용)
   * @param prefix SqidsPrefix 상수에 정의된 접두사 라벨
   * @throws InvalidSqidIdException ID가 음수이거나 0인 경우
   */
  encode(id: bigint, prefix?: SqidsPrefixType): string {
    // ID 유효성 검증
    if (id <= 0n) {
      throw new InvalidSqidIdException(id);
    }

    // 1. Knuth's Multiplicative Hash 적용 (난독화)
    const scrambledId = (id * KNUTH_PRIME) & KNUTH_MASK;

    // 2. 64비트를 상하위 32비트로 분할
    const high = Number(scrambledId >> 32n);
    const low = Number(scrambledId & 0xffffffffn);

    // 3. Sqids 인코딩
    const sqidsInstance = this.getSqidsInstance(prefix);
    const sqid = sqidsInstance.encode([high, low]);
    return prefix ? `${prefix}${SQIDS_DELIMITER}${sqid}` : sqid;
  }

  /**
   * Sqid 문자열을 BigInt ID로 디코딩합니다.
   *
   * @param sqid 디코딩할 Sqid 문자열
   * @param prefix SqidsPrefix 상수에 정의된 접두사 라벨
   * @throws InvalidSqidFormatException 유효하지 않은 Sqid 형식이거나 접두사가 일치하지 않는 경우
   */
  decode(sqid: string, prefix?: SqidsPrefixType): bigint {
    let targetSqid = sqid;

    if (prefix) {
      const prefixWithDelimiter = `${prefix}${SQIDS_DELIMITER}`;
      if (!sqid.startsWith(prefixWithDelimiter)) {
        throw new InvalidSqidFormatException(sqid, prefix);
      }
      targetSqid = sqid.slice(prefixWithDelimiter.length);
    }

    const sqidsInstance = this.getSqidsInstance(prefix);
    const decoded = sqidsInstance.decode(targetSqid);
    if (decoded.length < 2) {
      throw new InvalidSqidFormatException(sqid, prefix);
    }

    const [high, low] = decoded;

    // 1. 상하위 비트 병합
    const scrambledId = (BigInt(high) << 32n) | BigInt(low);

    // 2. Multiplicative Inverse 적용 (복구)
    const originalId = (scrambledId * KNUTH_INVERSE) & KNUTH_MASK;

    return originalId;
  }

  /**
   * Sqid 문자열을 자동으로 접두사를 감지하여 디코딩합니다. (관리자용)
   * 접두사가 포함되어 있으면 자동으로 분리하여 처리합니다.
   *
   * @param sqid 디코딩할 Sqid 문자열 (접두사 포함/미포함 모두 가능)
   * @returns { id: bigint, prefix: string | null } 디코딩된 ID와 감지된 접두사
   * @throws InvalidSqidFormatException 유효하지 않은 Sqid 형식인 경우
   */
  decodeAuto(sqid: string): { id: bigint; prefix: string | null } {
    // 구분자가 있는지 확인
    const delimiterIndex = sqid.indexOf(SQIDS_DELIMITER);

    if (delimiterIndex > 0) {
      const potentialPrefix = sqid.slice(0, delimiterIndex);
      const validPrefixes = Object.values(SqidsPrefix) as string[];

      // 유효한 접두사인지 확인
      if (validPrefixes.includes(potentialPrefix)) {
        const targetSqid = sqid.slice(delimiterIndex + 1);
        const sqidsInstance = this.getSqidsInstance(
          potentialPrefix as SqidsPrefixType,
        );
        const decoded = sqidsInstance.decode(targetSqid);

        if (decoded.length < 2) {
          throw new InvalidSqidFormatException(sqid);
        }

        const [high, low] = decoded;
        const scrambledId = (BigInt(high) << 32n) | BigInt(low);
        const originalId = (scrambledId * KNUTH_INVERSE) & KNUTH_MASK;

        return { id: originalId, prefix: potentialPrefix };
      }
    }

    // 접두사가 없는 경우 기본 Sqids로 처리
    const sqidsInstance = this.getSqidsInstance();
    const decoded = sqidsInstance.decode(sqid);

    if (decoded.length < 2) {
      throw new InvalidSqidFormatException(sqid);
    }

    const [high, low] = decoded;
    const scrambledId = (BigInt(high) << 32n) | BigInt(low);
    const originalId = (scrambledId * KNUTH_INVERSE) & KNUTH_MASK;

    return { id: originalId, prefix: null };
  }
}

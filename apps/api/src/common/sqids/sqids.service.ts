import { Injectable } from '@nestjs/common';
import Sqids from 'sqids';
import { EnvService } from '../env/env.service';
import { SQIDS_DELIMITER, SqidsPrefixType, SqidsPrefix, KNUTH_PRIME, KNUTH_INVERSE, KNUTH_MASK } from './sqids.constants';
import { InvalidSqidFormatException, InvalidSqidIdException } from './sqids.exception';

@Injectable()
export class SqidsService {
    private readonly sqids: Sqids;

    constructor(private readonly envService: EnvService) {
        const { alphabet, minLength } = this.envService.sqids;
        this.sqids = new Sqids({
            alphabet,
            minLength,
        });
    }

    /**
     * ID를 Sqid 문자열로 인코딩합니다.
     * Knuth's Multiplicative Hash를 적용하여 순차적 ID를 난독화한 후 Sqid로 변환합니다.
     * 
     * @param id 인코딩할 ID (number | bigint, 양수만 허용)
     * @param prefix SqidsPrefix 상수에 정의된 접두사 라벨
     * @throws InvalidSqidIdException ID가 음수이거나 0인 경우
     */
    encode(id: number | bigint, prefix?: SqidsPrefixType): string {
        const bigIntId = BigInt(id);

        // ID 유효성 검증
        if (bigIntId <= 0n) {
            throw new InvalidSqidIdException(id);
        }

        // 1. Knuth's Multiplicative Hash 적용 (난독화)
        const scrambledId = (bigIntId * KNUTH_PRIME) & KNUTH_MASK;

        // 2. 64비트를 상하위 32비트로 분할
        const high = Number(scrambledId >> 32n);
        const low = Number(scrambledId & 0xffffffffn);

        // 3. Sqids 인코딩
        const sqid = this.sqids.encode([high, low]);
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

        const decoded = this.sqids.decode(targetSqid);
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
                const id = this.decodeRaw(targetSqid);
                return { id, prefix: potentialPrefix };
            }
        }

        // 접두사가 없는 경우 전체를 Sqid로 처리
        const id = this.decodeRaw(sqid);
        return { id, prefix: null };
    }

    /**
     * 순수 Sqid 문자열만 디코딩합니다. (접두사/구분자 처리 없음)
     * 
     * @param sqid 순수 Sqid 문자열
     * @throws InvalidSqidFormatException 유효하지 않은 Sqid 형식인 경우
     */
    private decodeRaw(sqid: string): bigint {
        const decoded = this.sqids.decode(sqid);
        if (decoded.length < 2) {
            throw new InvalidSqidFormatException(sqid);
        }

        const [high, low] = decoded;

        // 1. 상하위 비트 병합
        const scrambledId = (BigInt(high) << 32n) | BigInt(low);

        // 2. Multiplicative Inverse 적용 (복구)
        const originalId = (scrambledId * KNUTH_INVERSE) & KNUTH_MASK;

        return originalId;
    }
}

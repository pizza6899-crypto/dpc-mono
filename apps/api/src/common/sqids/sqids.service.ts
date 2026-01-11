import { Injectable } from '@nestjs/common';
import Sqids from 'sqids';
import { EnvService } from '../env/env.service';
import { SQIDS_DELIMITER, SqidsPrefixType, KNUTH_PRIME, KNUTH_INVERSE, KNUTH_MASK } from './sqids.constants';
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
}

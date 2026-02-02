import type { WageringRequirement } from '../domain/wagering-requirement.entity';
import type { ExchangeCurrencyCode, WageringStatus, WageringSourceType, Prisma } from '@prisma/client';
import type { PaginatedData } from 'src/common/http/types/pagination.types';

export interface WageringRequirementRepositoryPort {
    /**
     * 새로운 롤링 조건을 생성합니다.
     */
    create(wageringRequirement: WageringRequirement): Promise<WageringRequirement>;

    /**
     * 해당 유저의 특정 통화에 대한 활성 롤링 조건을 우선순위대로 조회합니다.
     * 정렬: priority DESC, createdAt ASC
     */
    findActiveByUserIdAndCurrency(userId: bigint, currency: ExchangeCurrencyCode): Promise<WageringRequirement[]>;

    /**
     * 롤링 조건을 업데이트하고, 필요시 로그를 생성합니다.
     * @param wageringRequirement 업데이트할 롤링 조건
     * @param logData (선택) 롤링 기여 로그 데이터
     */
    save(
        wageringRequirement: WageringRequirement,
        logData?: {
            gameRoundId: bigint;
            requestAmount: Prisma.Decimal;
            contributionRate: Prisma.Decimal;
            contributedAmount: Prisma.Decimal;
        }
    ): Promise<WageringRequirement>;

    /**
     * ID로 롤링 조건을 조회합니다.
     */
    findById(id: bigint): Promise<WageringRequirement | null>;

    /**
     * ID로 롤링 조건을 조회하고, 없으면 예외를 발생시킵니다.
     */
    getById(id: bigint): Promise<WageringRequirement>;

    /**
     * 유저의 모든 롤링 조건을 조회합니다. (필터링 가능)
     */
    findByUserId(userId: bigint, status?: WageringStatus): Promise<WageringRequirement[]>;

    /**
     * 유저의 모든 롤링 조건을 페이지네이션하여 조회합니다.
     */
    findPaginated(params: {
        userId?: bigint;
        statuses?: WageringStatus[];
        sourceType?: WageringSourceType;
        currency?: ExchangeCurrencyCode;
        fromAt?: Date;
        toAt?: Date;
        page: number;
        limit: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<PaginatedData<WageringRequirement>>;
}

export const WAGERING_REQUIREMENT_REPOSITORY = Symbol('WAGERING_REQUIREMENT_REPOSITORY');

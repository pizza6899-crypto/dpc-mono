import { Inject, Injectable, Logger } from '@nestjs/common';
import { WageringRequirement } from '../domain';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { Prisma } from '@prisma/client';
import type { ExchangeCurrencyCode, WageringSourceType } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import type { RequestClientInfo } from 'src/common/http/types';
import { GetWageringConfigService } from '../../config/application/get-wagering-config.service';
import { DateTime } from 'luxon';

interface CreateWageringRequirementParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    sourceType: WageringSourceType;
    requiredAmount: Prisma.Decimal;
    priority?: number;
    depositDetailId?: bigint;
    userPromotionId?: bigint;
    expiresAt?: Date;
    autoCancelThreshold?: Prisma.Decimal;
    requestInfo?: RequestClientInfo;
}

@Injectable()
export class CreateWageringRequirementService {
    private readonly logger = new Logger(CreateWageringRequirementService.name);

    constructor(
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly repository: WageringRequirementRepositoryPort,
        private readonly snowflakeService: SnowflakeService,
        private readonly getConfigService: GetWageringConfigService,
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly dispatchLogService: DispatchLogService,
    ) { }

    async execute(params: CreateWageringRequirementParams): Promise<WageringRequirement> {
        // 0. 글로벌 설정 조회
        const config = await this.getConfigService.execute();

        const {
            userId,
            currency,
            sourceType,
            requiredAmount,
            priority = 0,
            depositDetailId,
            userPromotionId,
            requestInfo,
        } = params;

        // 1. 설정 보정
        const autoCancelThreshold = params.autoCancelThreshold ?? config.getCancellationThreshold(currency);
        const expiresAt = params.expiresAt ?? DateTime.now().plus({ days: config.defaultBonusExpiryDays }).toJSDate();

        this.logger.log(
            `Creating wagering requirement for user ${userId}, currency ${currency}, required ${requiredAmount}, source ${sourceType}`,
        );

        // Snowflake ID 생성
        const { id } = this.snowflakeService.generate();

        // Create using factory method
        const wageringRequirement = WageringRequirement.create({
            id,
            userId,
            currency,
            sourceType,
            requiredAmount,
            priority,
            depositDetailId,
            userPromotionId,
            expiresAt,
            autoCancelThreshold,
            appliedConfig: {
                snapshot: {
                    defaultBonusExpiryDays: config.defaultBonusExpiryDays,
                    isWageringCheckEnabled: config.isWageringCheckEnabled,
                    currencyThreshold: config.getCancellationThreshold(currency).toString(),
                }
            }
        });

        const created = await this.repository.create(wageringRequirement);

        // Explicit Audit Log Dispatch
        await this.dispatchLogService.dispatch({
            type: LogType.ACTIVITY,
            data: {
                userId: userId.toString(),
                category: 'WAGERING',
                action: 'CREATE_WAGERING_REQUIREMENT',
                metadata: {
                    wageringId: created.id?.toString(),
                    sourceType,
                    requiredAmount: requiredAmount.toString(),
                    currency,
                    depositDetailId: depositDetailId?.toString(),
                    userPromotionId: userPromotionId?.toString(),
                }
            }
        }, params.requestInfo);

        return created;
    }
}

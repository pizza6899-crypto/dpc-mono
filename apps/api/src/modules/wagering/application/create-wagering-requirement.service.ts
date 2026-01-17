import { Inject, Injectable, Logger } from '@nestjs/common';
import { WageringRequirement, WageringPolicy } from '../domain';
import { WAGERING_REQUIREMENT_REPOSITORY } from '../ports';
import type { WageringRequirementRepositoryPort } from '../ports';
import { Prisma } from 'src/generated/prisma';
import type { ExchangeCurrencyCode, WageringSourceType } from 'src/generated/prisma';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import type { RequestClientInfo } from 'src/common/http/types';

interface CreateWageringRequirementParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    sourceType: WageringSourceType;
    requiredAmount: Prisma.Decimal;
    priority?: number;
    depositDetailId?: bigint;
    userPromotionId?: bigint;
    expiresAt?: Date;
    cancellationBalanceThreshold?: Prisma.Decimal;
    requestInfo?: RequestClientInfo;
}

@Injectable()
export class CreateWageringRequirementService {
    private readonly logger = new Logger(CreateWageringRequirementService.name);

    constructor(
        @Inject(WAGERING_REQUIREMENT_REPOSITORY)
        private readonly repository: WageringRequirementRepositoryPort,
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly dispatchLogService: DispatchLogService,
    ) { }

    async execute(params: CreateWageringRequirementParams): Promise<WageringRequirement> {
        const {
            userId,
            currency,
            sourceType,
            requiredAmount,
            priority = 0,
            depositDetailId,
            userPromotionId,
            expiresAt,
            cancellationBalanceThreshold,
        } = params;

        this.logger.log(
            `Creating wagering requirement for user ${userId}, currency ${currency}, required ${requiredAmount}, source ${sourceType}`,
        );

        // Factory method wrapper since we don't have a full factory class yet
        // In a pure DDD approach, ID generation would happen here or in a factory.
        // For now, we rely on the repository implementation to handle ID generation (DB AutoInc).
        // The mapper handles reconstructing the entity from DB result.

        // Create using factory method
        const wageringRequirement = WageringRequirement.create({
            userId,
            currency,
            sourceType,
            requiredAmount,
            priority,
            depositDetailId,
            userPromotionId,
            expiresAt,
            cancellationBalanceThreshold,
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

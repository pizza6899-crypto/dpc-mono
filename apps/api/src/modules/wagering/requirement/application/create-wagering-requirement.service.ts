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
import { Transactional } from '@nestjs-cls/transactional';

interface CreateWageringRequirementCommand {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    sourceType: WageringSourceType;
    sourceId: bigint;
    requiredAmount: Prisma.Decimal;
    priority?: number;
    expiresAt?: Date;
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

    @Transactional()
    async execute(command: CreateWageringRequirementCommand): Promise<WageringRequirement> {
        // 0. 글로벌 설정 조회
        const config = await this.getConfigService.execute();

        const {
            userId,
            currency,
            sourceType,
            sourceId,
            requiredAmount,
            priority = 0,
        } = command;

        // 1. 설정 보정
        const setting = config.getSetting(currency);
        const expiresAt = command.expiresAt ?? DateTime.now().plus({ days: config.defaultBonusExpiryDays }).toJSDate();

        // 생성 시점의 잠재적 락 금액 계산 (보조용 기록)
        // 실제 비즈니스 로직에 따라 다르겠지만, 여기서는 기본 원금으로 기록
        const initialLockedAmount = requiredAmount;

        this.logger.log(
            `Creating wagering requirement for user ${userId}, currency ${currency}, required ${requiredAmount}, source ${sourceType}(${sourceId})`,
        );

        // Snowflake ID 생성
        const { id } = this.snowflakeService.generate();

        // Create using factory method
        const wageringRequirement = WageringRequirement.create({
            id,
            userId,
            currency,
            sourceType,
            sourceId,
            requiredAmount,
            priority,
            initialLockedAmount,
            isAutoCancelable: true,
            expiresAt,
            appliedConfig: {
                snapshot: {
                    defaultBonusExpiryDays: config.defaultBonusExpiryDays,
                    isWageringCheckEnabled: config.isWageringCheckEnabled,
                    currencyThreshold: setting.cancellationThreshold.toString(),
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
                    sourceId: sourceId.toString(),
                    requiredAmount: requiredAmount.toString(),
                    currency,
                }
            }
        }, command.requestInfo);

        return created;
    }
}

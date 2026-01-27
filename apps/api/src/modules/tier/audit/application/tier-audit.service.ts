import { Injectable, Logger } from '@nestjs/common';
import { TierAuditRepositoryPort, CreateTierHistoryProps } from '../infrastructure/audit.repository.port';
import { EvaluationStatus } from '@prisma/client';

@Injectable()
export class TierAuditService {
    private readonly logger = new Logger(TierAuditService.name);

    constructor(private readonly auditRepository: TierAuditRepositoryPort) { }

    /**
     * 유저의 티어 변경 이력을 기록합니다.
     */
    async recordTierChange(props: CreateTierHistoryProps): Promise<void> {
        await this.auditRepository.saveHistory(props);

        // 승급 시 강등 경고가 있었다면 제거
        if (props.changeType === 'UPGRADE') {
            await this.auditRepository.deleteDemotionWarning(props.userId).catch((error) => {
                this.logger.warn(`Failed to delete demotion warning for user ${props.userId}: ${error.message}`);
            });
        }
    }

    /**
     * 배치 심사 로그를 시작합니다.
     */
    async startEvaluationLog(): Promise<bigint> {
        const log = await this.auditRepository.createEvaluationLog(EvaluationStatus.RUNNING);
        return log.id;
    }

    /**
     * 배치 심사 로그를 완료하거나 에러를 기록합니다.
     */
    async finishEvaluationLog(id: bigint, metrics: any, error?: string): Promise<void> {
        await this.auditRepository.updateEvaluationLog(id, {
            ...metrics,
            status: error ? EvaluationStatus.FAILED : EvaluationStatus.SUCCESS,
            finishedAt: new Date(),
            errorMessage: error ?? null
        });
    }
}

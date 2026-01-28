import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository';
import { TierRepositoryPort } from '../../master/infrastructure/master.repository.port';
import { TierAuditService } from '../application/tier-audit.service';
import { ClsService } from 'nestjs-cls';
import { ConcurrencyService } from 'src/common/concurrency/concurrency.service';
import { GlobalLockKey } from 'src/common/concurrency/concurrency.constants';

@Injectable()
export class TierAuditScheduler {
    private readonly logger = new Logger(TierAuditScheduler.name);

    constructor(
        private readonly tierAuditService: TierAuditService,
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        private readonly cls: ClsService,
        private readonly concurrencyService: ConcurrencyService,
    ) { }

    /**
     * Hourly Tier Stats Snapshot
     * - Records the total number of users in each tier every hour.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async snapshotHourlyStats() {
        await this.cls.run(async () => {
            // Apply distributed lock to prevent duplicate execution across multiple instances
            await this.concurrencyService.runExclusive(GlobalLockKey.TIER_AUDIT_HOURLY_STATS, async () => {
                try {
                    const now = new Date();
                    const counts = await this.userTierRepository.countGroupByTierId();
                    const allTiers = await this.tierRepository.findAll();

                    // Map counts to a lookup object
                    const countMap = new Map<string, number>();
                    counts.forEach(c => countMap.set(c.tierId.toString(), c.count));

                    for (const tier of allTiers) {
                        const tierIdStr = tier.id.toString();
                        const userCount = countMap.get(tierIdStr) || 0;

                        await this.tierAuditService.recordTierStats(now, tier.id, {
                            snapshotUserCount: userCount
                        });
                    }

                    this.logger.log(`Hourly tier stats snapshot completed. Processed ${allTiers.length} tiers.`);
                } catch (error) {
                    this.logger.error(`Failed to snapshot hourly tier stats: ${error.message}`, error.stack);
                    throw error; // Re-throw to let runExclusive record the failure
                }
            }, { timeoutSeconds: 600 }); // 10 minutes timeout
        });
    }
}

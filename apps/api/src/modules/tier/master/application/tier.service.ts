import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TierRepositoryPort } from '../infrastructure/tier.repository.port';
import type { UpdateTierProps } from '../infrastructure/tier.repository.port';
import { Tier } from '../domain/tier.entity';
import { TierNotFoundException } from '../domain/tier-master.exception';
import { TierMasterPolicy } from '../domain/tier-master.policy';
import { AttachFileService } from '../../../file/application/attach-file.service';
import { EnvService } from 'src/common/env/env.service';
import { FileUsageType } from '../../../file/domain';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class TierService {
    constructor(
        private readonly repository: TierRepositoryPort,
        private readonly policy: TierMasterPolicy,
        private readonly attachFileService: AttachFileService,
        private readonly envService: EnvService,
    ) { }

    async findAll(): Promise<Tier[]> {
        return this.repository.findAll();
    }

    async findByCode(code: string): Promise<Tier> {
        const tiers = await this.findAll();
        const tier = tiers.find(t => t.code === code);

        if (!tier) {
            throw new TierNotFoundException();
        }
        return tier;
    }

    @Transactional()
    async update(props: UpdateTierProps): Promise<Tier> {
        const currentTier = await this.repository.findByCode(props.code);
        if (!currentTier) {
            throw new TierNotFoundException();
        }

        const existingLanguages = currentTier.translations.map(t => t.language);

        // 도메인 정책 검증
        this.policy.validateTranslations(props.translations, existingLanguages);
        this.policy.validateUpdateProps(props);

        // 전체 티어 정합성 검증 (우선순위 중복 및 요건 역전 방지)
        const allTiers = await this.findAll();
        const updatedTiers = allTiers.map(t => {
            if (t.code === props.code) {
                // 수정될 티어의 가상 객체 생성 (Prisma.Decimal 호환을 위해 값 변환 필요할 수 있음)
                // 실제 Tier.fromPersistence와 유사하게 동작하도록 구성
                return {
                    ...t,
                    priority: props.priority ?? t.priority,
                    requirementUsd: props.requirementUsd !== undefined ? new Prisma.Decimal(props.requirementUsd) : t.requirementUsd,
                    requirementDepositUsd: props.requirementDepositUsd !== undefined ? new Prisma.Decimal(props.requirementDepositUsd) : t.requirementDepositUsd,
                    maintenanceRollingUsd: props.maintenanceRollingUsd !== undefined ? new Prisma.Decimal(props.maintenanceRollingUsd) : t.maintenanceRollingUsd,
                } as any;
            }
            return t;
        });
        this.policy.validateTierIntegrity(updatedTiers);

        // 이미지 처리 (monolithic way: AttachFileService 활용)
        const { imageFileId } = props;
        let imageUrl: string | undefined | null = undefined;

        if (imageFileId) {
            const { files } = await this.attachFileService.execute({
                fileIds: [imageFileId],
                usageType: FileUsageType.TIER_IMAGE,
                usageId: currentTier.id,
            });
            imageUrl = files[0].publicUrl(this.envService.app.cdnUrl);
        } else if (imageFileId === null) {
            imageUrl = null;
        }

        // imageFileId는 DB 필드가 아니므로 제외하고, 대신 imageUrl을 포함시킴
        const { imageFileId: _, ...repoData } = props;

        // UpdateTierProps 인터페이스에 imageUrl이 정식으로 포함되어 있지 않다면
        // Repository 레벨에서 이를 처리할 수 있도록 타입을 맞추거나 확장이 필요합니다.
        // 현재는 전개를 통해 값을 전달합니다.
        const updatePayload: UpdateTierProps = {
            ...repoData,
            ...(imageUrl !== undefined ? { imageUrl } : {}),
        };

        return this.repository.update(updatePayload);
    }
}

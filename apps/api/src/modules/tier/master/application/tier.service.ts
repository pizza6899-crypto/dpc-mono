import { Injectable } from '@nestjs/common';
import { TierRepositoryPort } from '../infrastructure/master.repository.port';
import type { UpdateTierProps } from '../infrastructure/master.repository.port';
import { Tier } from '../domain/tier.entity';
import { TierNotFoundException } from '../domain/tier-master.exception';
import { TierMasterPolicy } from '../domain/tier-master.policy';
import { AttachFileService } from '../../../file/application/attach-file.service';
import { EnvService } from 'src/common/env/env.service';
import { FileUsageType } from '../../../file/domain';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class TierService {
    private cachedTiers: Tier[] | null = null;
    private lastFetched: number = 0;
    private readonly CACHE_TTL = 60 * 1000; // 1분

    constructor(
        private readonly repository: TierRepositoryPort,
        private readonly policy: TierMasterPolicy,
        private readonly attachFileService: AttachFileService,
        private readonly envService: EnvService,
    ) { }

    async findAll(): Promise<Tier[]> {
        const now = Date.now();
        if (this.cachedTiers && (now - this.lastFetched < this.CACHE_TTL)) {
            return this.cachedTiers;
        }

        const tiers = await this.repository.findAll();
        this.cachedTiers = tiers;
        this.lastFetched = now;
        return tiers;
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

        const updated = await this.repository.update(updatePayload);

        // 캐시 즉시 갱신
        this.cachedTiers = null;
        this.lastFetched = 0;

        return updated;
    }
}

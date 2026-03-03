import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TierRepositoryPort } from '../infrastructure/tier.repository.port';
import type { UpdateTierProps } from '../infrastructure/tier.repository.port';
import { Tier } from '../domain/tier.entity';
import { TierNotFoundException } from '../domain/tier-config.exception';
import { TierConfigPolicy } from '../domain/tier-config.policy';
import { AttachFileService } from '../../../file/application/attach-file.service';
import { EnvService } from 'src/common/env/env.service';
import { FileUsageType } from '../../../file/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { Cast } from 'src/infrastructure/persistence/persistence.util';

@Injectable()
export class TierService {
  constructor(
    private readonly repository: TierRepositoryPort,
    private readonly policy: TierConfigPolicy,
    private readonly attachFileService: AttachFileService,
    private readonly envService: EnvService,
  ) { }

  async findAll(): Promise<Tier[]> {
    return this.repository.findAll();
  }

  async findByCode(code: string): Promise<Tier> {
    const tiers = await this.findAll();
    const tier = tiers.find((t) => t.code === code);

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

    const existingLanguages = currentTier.translations.map((t) => t.language);

    // 도메인 정책 검증
    this.policy.validateTranslations(props.translations, existingLanguages);
    this.policy.validateUpdateProps(props as any);

    // 전체 티어 정합성 검증 (레벨 중복 및 요건 역전 방지)
    // 동시성 문제를 방지하기 위해 캐시를 무시하고 DB에서 최신 목록을 직접 가져옵니다.
    const allTiers = await this.repository.findAll({ ignoreCache: true });
    const updatedTiers = allTiers.map((t) => {
      if (t.code === props.code) {
        return {
          ...t,
          level: props.level ?? t.level,
          upgradeExpRequired:
            props.upgradeExpRequired !== undefined
              ? Cast.bigint(props.upgradeExpRequired)
              : t.upgradeExpRequired,
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

    const updatePayload: UpdateTierProps = {
      ...repoData,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    };

    return this.repository.update(updatePayload);
  }
}

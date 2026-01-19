import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CasinoGameProvider } from '../../domain';
import { CASINO_GAME_PROVIDER_REPOSITORY } from '../../ports/casino-game-provider.repository.token';
import { type CasinoGameProviderRepositoryPort } from '../../ports/casino-game-provider.repository.port';
import { AttachFileService } from '../../../../file/application/attach-file.service';
import { FileUsageType } from '../../../../file/domain';
import { EnvService } from 'src/common/env/env.service';
import { SqidsService } from 'src/common/sqids/sqids.service';

interface UpdateGameProviderParams {
    id: bigint;
    name?: string;
    imageId?: string;
    isActive?: boolean;
}

@Injectable()
export class UpdateGameProviderService {
    constructor(
        @Inject(CASINO_GAME_PROVIDER_REPOSITORY)
        private readonly repository: CasinoGameProviderRepositoryPort,
        private readonly attachFileService: AttachFileService,
        private readonly envService: EnvService,
    ) { }

    @Transactional()
    async execute(params: UpdateGameProviderParams): Promise<CasinoGameProvider> {
        const provider = await this.repository.getById(params.id);
        let newImageUrl: string | undefined;

        if (params.imageId) {
            // 1. 파일을 비즈니스 엔티티와 연결 (이 과정에서 파일이 public/casino_provider_logo/... 경로로 이동됨)
            const { files } = await this.attachFileService.execute({
                fileIds: [params.imageId],
                usageType: FileUsageType.CASINO_PROVIDER_LOGO,
                usageId: provider.id!,
            });

            // 2. 파일 정보 재조회 없이 반환값 사용 (이미지 경로가 temp에서 정식 경로로 변경된 데이터)
            const file = files[0];
            if (file) {
                // CDN 베이스 URL과 결합하여 전체 조회 URL 생성 (역정규화 저장용)
                newImageUrl = file.publicUrl(this.envService.app.cdnUrl) ?? undefined;
            }
        }

        const updatedProvider = provider.update({
            name: params.name,
            imageUrl: newImageUrl, // 새로 생성된 URL이 있으면 덮어쓰고, 없으면 기존 URL 유지
            isActive: params.isActive,
        });

        // 3. 최종적으로 프로바이더의 imageUrl 컬럼에 경로 저장
        return await this.repository.update(updatedProvider);
    }
}

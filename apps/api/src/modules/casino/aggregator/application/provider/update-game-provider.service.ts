import { Inject, Injectable } from '@nestjs/common';
import { CasinoGameProvider } from '../../domain';
import { CASINO_GAME_PROVIDER_REPOSITORY } from '../../ports/casino-game-provider.repository.token';
import { type CasinoGameProviderRepositoryPort } from '../../ports/casino-game-provider.repository.port';
import { AttachFileService } from '../../../../file/application/attach-file.service';
import { FILE_REPOSITORY } from '../../../../file/ports/file.repository.token';
import { type FileRepositoryPort } from '../../../../file/ports/file.repository.port';
import { FileUsageType } from '../../../../file/domain';
import { EnvService } from 'src/common/env/env.service';

interface UpdateGameProviderParams {
    id: bigint;
    name?: string;
    groupCode?: string;
    imageId?: string;
    isActive?: boolean;
}

@Injectable()
export class UpdateGameProviderService {
    constructor(
        @Inject(CASINO_GAME_PROVIDER_REPOSITORY)
        private readonly repository: CasinoGameProviderRepositoryPort,
        private readonly attachFileService: AttachFileService,
        @Inject(FILE_REPOSITORY)
        private readonly fileRepository: FileRepositoryPort,
        private readonly envService: EnvService,
    ) { }

    async execute(params: UpdateGameProviderParams): Promise<CasinoGameProvider> {
        const provider = await this.repository.getById(params.id);
        let newImageUrl: string | undefined;

        if (params.imageId) {
            const fileId = BigInt(params.imageId);
            await this.attachFileService.execute({
                fileIds: [fileId],
                usageType: FileUsageType.CASINO_PROVIDER_LOGO,
                usageId: provider.id!,
            });

            // 파일 정보 조회하여 URL 구성
            const file = await this.fileRepository.findById(fileId);
            if (file) {
                // S3 CloudFront URL 구성 (환경변수 의존)
                const distributionUrl = this.envService.app.cdnUrl;
                newImageUrl = `${distributionUrl}/${file.key}`;
            }
        }

        const updatedProvider = provider.update({
            name: params.name,
            groupCode: params.groupCode,
            imageUrl: newImageUrl, // 이미지가 변경된 경우에만 업데이트
            isActive: params.isActive,
        });

        return await this.repository.update(updatedProvider);
    }
}

import { Inject, Injectable } from '@nestjs/common';
import { FileUsageType } from '../domain';
import { FILE_USAGE_REPOSITORY } from '../ports/file-usage.repository.token';
import { type FileUsageRepositoryPort } from '../ports/file-usage.repository.port';

@Injectable()
export class DetachFileService {
    constructor(
        @Inject(FILE_USAGE_REPOSITORY)
        private readonly repository: FileUsageRepositoryPort,
    ) { }

    async execute(fileId: bigint): Promise<void> {
        await this.repository.deleteByFileId(fileId);
    }

    async detachByUsage(usageType: FileUsageType, usageId: bigint): Promise<void> {
        await this.repository.deleteByUsage(usageType, usageId);
    }
}

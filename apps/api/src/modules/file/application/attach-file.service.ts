import { Inject, Injectable } from '@nestjs/common';
import { FileUsageEntity, FileUsageType } from '../domain';
import { FILE_USAGE_REPOSITORY } from '../ports/file-usage.repository.token';
import { type FileUsageRepositoryPort } from '../ports/file-usage.repository.port';

interface AttachFileCommand {
    fileId: bigint;
    usageType: FileUsageType;
    usageId: bigint;
    order?: number;
}

@Injectable()
export class AttachFileService {
    constructor(
        @Inject(FILE_USAGE_REPOSITORY)
        private readonly repository: FileUsageRepositoryPort,
    ) { }

    async execute(command: AttachFileCommand): Promise<FileUsageEntity> {
        const fileUsage = FileUsageEntity.create({
            fileId: command.fileId,
            usageType: command.usageType,
            usageId: command.usageId,
            order: command.order
        });

        return await this.repository.create(fileUsage);
    }
}

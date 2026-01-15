import { Inject, Injectable } from '@nestjs/common';
import * as path from 'path';
import { FileUsageEntity, FileUsageType, FileAccessType, FileValidationException, getFileUsageConfig } from '../domain';
import { FILE_USAGE_REPOSITORY } from '../ports/file-usage.repository.token';
import { type FileUsageRepositoryPort } from '../ports/file-usage.repository.port';
import { FILE_REPOSITORY } from '../ports/file.repository.token';
import { type FileRepositoryPort } from '../ports/file.repository.port';
import { Transactional } from '@nestjs-cls/transactional';
import { StorageService } from 'src/infrastructure/storage/storage.service';

interface AttachFileCommand {
    fileIds: bigint[];
    usageType: FileUsageType;
    usageId: bigint;
    accessType?: FileAccessType;
}

@Injectable()
export class AttachFileService {
    constructor(
        @Inject(FILE_USAGE_REPOSITORY)
        private readonly fileUsageRepository: FileUsageRepositoryPort,
        @Inject(FILE_REPOSITORY)
        private readonly fileRepository: FileRepositoryPort,
        private readonly storageService: StorageService,
    ) { }

    @Transactional()
    async execute(command: AttachFileCommand): Promise<FileUsageEntity[]> {
        const { fileIds, usageType, usageId } = command;

        // 1. Fetch Files
        const files = await this.fileRepository.findByIds(fileIds);
        if (files.length !== fileIds.length) {
            throw new FileValidationException('One or more files not found.');
        }

        const accessType = command.accessType || this.resolveAccessType(usageType);
        const folder = accessType === FileAccessType.PUBLIC ? 'public' : 'private';

        // 2. Move Files & Update Entities
        await Promise.all(files.map(async (file) => {
            const fileName = path.basename(file.key);
            const newPath = `${folder}/${usageType.toLowerCase()}/${usageId}`;
            const newKey = `${newPath}/${fileName}`;

            // Check if needs moving (different key)
            if (file.key !== newKey) {
                // Determine source bucket/key? We assume bucket is same.
                await this.storageService.move(file.key, newKey);

                const updatedFile = file.updatePath({
                    path: newPath,
                    key: newKey,
                    accessType: accessType,
                });
                await this.fileRepository.update(updatedFile);
            }
        }));

        // 3. Create Usages
        const fileUsages = fileIds.map((fileId, index) =>
            FileUsageEntity.create({
                fileId: fileId,
                usageType: usageType,
                usageId: usageId,
                order: index
            })
        );

        return await Promise.all(
            fileUsages.map(usage => this.fileUsageRepository.create(usage))
        );
    }

    private resolveAccessType(usageType: FileUsageType): FileAccessType {
        const config = getFileUsageConfig(usageType);
        return config.accessType;
    }
}

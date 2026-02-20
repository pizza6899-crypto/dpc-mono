import { Inject, Injectable } from '@nestjs/common';
import * as path from 'path';
import {
  FileEntity,
  FileUsageEntity,
  FileUsageType,
  FileAccessType,
  FileValidationException,
  getFileUsageConfig,
} from '../domain';
import { FILE_USAGE_REPOSITORY } from '../ports/file-usage.repository.token';
import { type FileUsageRepositoryPort } from '../ports/file-usage.repository.port';
import { FILE_REPOSITORY } from '../ports/file.repository.token';
import { type FileRepositoryPort } from '../ports/file.repository.port';
import { Transactional } from '@nestjs-cls/transactional';
import { StorageService } from 'src/infrastructure/storage/storage.service';

import { SqidsService } from 'src/common/sqids/sqids.service';
import { SqidsPrefix } from 'src/common/sqids/sqids.constants';

interface AttachFileCommand {
  fileIds: bigint[] | string[];
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
    private readonly sqidsService: SqidsService,
  ) {}

  @Transactional()
  async execute(
    command: AttachFileCommand,
  ): Promise<{ usages: FileUsageEntity[]; files: FileEntity[] }> {
    const { fileIds: inputIds, usageType, usageId } = command;

    // 0. Decode file IDs if they are strings
    const fileIds = inputIds.map((id) =>
      typeof id === 'string'
        ? this.sqidsService.decode(id, SqidsPrefix.FILE)
        : id,
    );

    // 1. Fetch Files
    const files = await this.fileRepository.findByIds(fileIds);
    if (files.length !== fileIds.length) {
      throw new FileValidationException('One or more files not found.');
    }

    const accessType = command.accessType || this.resolveAccessType(usageType);
    const folder = accessType === FileAccessType.PUBLIC ? 'public' : 'private';

    // 2. Move Files & Update Entities
    const updatedFiles = await Promise.all(
      files.map(async (file) => {
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
          return await this.fileRepository.update(updatedFile);
        }
        return file;
      }),
    );

    // 3. Create Usages
    const fileUsages = fileIds.map((fileId, index) =>
      FileUsageEntity.create({
        fileId: fileId,
        usageType: usageType,
        usageId: usageId,
        order: index,
      }),
    );

    const savedUsages = await Promise.all(
      fileUsages.map((usage) => this.fileUsageRepository.create(usage)),
    );

    return {
      usages: savedUsages,
      files: updatedFiles,
    };
  }

  private resolveAccessType(usageType: FileUsageType): FileAccessType {
    const config = getFileUsageConfig(usageType);
    return config.accessType;
  }
}

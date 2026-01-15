import { FileUsageEntity, FileUsageType } from '../domain';

export interface FileUsageRepositoryPort {
    create(fileUsage: FileUsageEntity): Promise<FileUsageEntity>;
    delete(id: bigint): Promise<void>;
    deleteByUsage(usageType: FileUsageType, usageId: bigint): Promise<void>;
    deleteByFileId(fileId: bigint): Promise<void>;
    findByUsage(usageType: FileUsageType, usageId: bigint): Promise<FileUsageEntity[]>;
    findByFileId(fileId: bigint): Promise<FileUsageEntity[]>;
}

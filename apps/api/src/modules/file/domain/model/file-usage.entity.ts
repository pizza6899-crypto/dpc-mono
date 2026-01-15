import { FileUsageType } from './file-usage.type';

export class FileUsageEntity {
    private constructor(
        public readonly id: bigint | null,
        public readonly fileId: bigint,
        public readonly usageType: FileUsageType,
        public readonly usageId: bigint,
        public readonly order: number,
        public readonly createdAt: Date,
    ) { }

    static create(params: {
        fileId: bigint;
        usageType: FileUsageType;
        usageId: bigint;
        order?: number;
    }): FileUsageEntity {
        return new FileUsageEntity(
            null,
            params.fileId,
            params.usageType,
            params.usageId,
            params.order || 0,
            new Date(),
        );
    }

    static reconstruct(params: {
        id: bigint;
        fileId: bigint;
        usageType: FileUsageType;
        usageId: bigint;
        order: number;
        createdAt: Date;
    }): FileUsageEntity {
        return new FileUsageEntity(
            params.id,
            params.fileId,
            params.usageType,
            params.usageId,
            params.order,
            params.createdAt,
        );
    }
}

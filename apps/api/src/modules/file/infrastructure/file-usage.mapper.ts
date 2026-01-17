import { Injectable } from '@nestjs/common';
import type { FileUsage as PrismaFileUsage } from 'src/generated/prisma';
import { FileUsageEntity, FileUsageType } from '../domain';

@Injectable()
export class FileUsageMapper {
    toDomain(record: PrismaFileUsage): FileUsageEntity {
        return FileUsageEntity.reconstruct({
            id: record.id,
            fileId: record.fileId,
            usageType: record.usageType as FileUsageType, // Casting string to Enum
            usageId: record.usageId,
            order: record.order,
            createdAt: record.createdAt,
        });
    }

    toPrisma(entity: FileUsageEntity): Omit<PrismaFileUsage, 'id' | 'createdAt'> {
        return {
            fileId: entity.fileId,
            usageType: entity.usageType,
            usageId: entity.usageId,
            order: entity.order,
        };
    }
}

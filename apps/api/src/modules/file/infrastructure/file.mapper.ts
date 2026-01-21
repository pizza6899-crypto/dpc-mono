import { Injectable } from '@nestjs/common';
import type { File as PrismaFile, FileStatus as PrismaFileStatus, FileAccessType as PrismaFileAccessType } from '@prisma/client';
import { FileAccessType, FileEntity, FileStatus } from '../domain';

@Injectable()
export class FileMapper {
    toDomain(record: PrismaFile): FileEntity {
        return FileEntity.reconstruct({
            id: record.id,
            bucket: record.bucket,
            path: record.path,
            key: record.key,
            hash: record.hash,
            filename: record.filename,
            mimetype: record.mimetype,
            size: record.size,
            width: record.width,
            height: record.height,
            status: this.mapStatusUsersToDomain(record.status),
            accessType: this.mapAccessTypeToDomain(record.accessType),
            uploaderId: record.uploaderId,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }

    toPrisma(entity: FileEntity): Omit<PrismaFile, 'id' | 'createdAt' | 'updatedAt'> {
        return {
            bucket: entity.bucket,
            path: entity.path,
            key: entity.key,
            hash: entity.hash,
            filename: entity.filename,
            mimetype: entity.mimetype,
            size: entity.size,
            width: entity.width,
            height: entity.height,
            status: this.mapStatusToPrisma(entity.status),
            accessType: this.mapAccessTypeToPrisma(entity.accessType),
            uploaderId: entity.uploaderId,
        };
    }

    private mapStatusUsersToDomain(status: PrismaFileStatus): FileStatus {
        switch (status) {
            case 'PENDING': return FileStatus.PENDING;
            case 'ACTIVE': return FileStatus.ACTIVE;
            case 'DELETED': return FileStatus.DELETED;
            default: return FileStatus.PENDING;
        }
    }

    private mapStatusToPrisma(status: FileStatus): PrismaFileStatus {
        switch (status) {
            case FileStatus.PENDING: return 'PENDING';
            case FileStatus.ACTIVE: return 'ACTIVE';
            case FileStatus.DELETED: return 'DELETED';
            default: return 'PENDING';
        }
    }

    private mapAccessTypeToDomain(type: PrismaFileAccessType): FileAccessType {
        switch (type) {
            case 'PUBLIC': return FileAccessType.PUBLIC;
            case 'PRIVATE': return FileAccessType.PRIVATE;
            default: return FileAccessType.PUBLIC;
        }
    }

    private mapAccessTypeToPrisma(type: FileAccessType): PrismaFileAccessType {
        switch (type) {
            case FileAccessType.PUBLIC: return 'PUBLIC';
            case FileAccessType.PRIVATE: return 'PRIVATE';
            default: return 'PUBLIC';
        }
    }
}

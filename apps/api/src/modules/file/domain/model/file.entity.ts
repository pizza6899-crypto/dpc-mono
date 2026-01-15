import { FileAccessType, FileStatus } from './file.enum';

export class FileEntity {
    private constructor(
        public readonly id: bigint | null,
        public readonly bucket: string,
        public readonly path: string,
        public readonly key: string,
        public readonly hash: string | null,
        public readonly filename: string,
        public readonly mimetype: string,
        public readonly size: bigint,
        public readonly width: number | null,
        public readonly height: number | null,
        public readonly status: FileStatus,
        public readonly accessType: FileAccessType,
        public readonly uploaderId: bigint | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(params: {
        bucket: string;
        path: string;
        key: string;
        hash?: string;
        filename: string;
        mimetype: string;
        size: bigint;
        width?: number;
        height?: number;
        status?: FileStatus;
        accessType?: FileAccessType;
        uploaderId?: bigint;
    }): FileEntity {
        return new FileEntity(
            null,
            params.bucket,
            params.path,
            params.key,
            params.hash || null,
            params.filename,
            params.mimetype,
            params.size,
            params.width || null,
            params.height || null,
            params.status || FileStatus.PENDING,
            params.accessType || FileAccessType.PUBLIC,
            params.uploaderId || null,
            new Date(),
            new Date(),
        );
    }

    static reconstruct(params: {
        id: bigint;
        bucket: string;
        path: string;
        key: string;
        hash: string | null;
        filename: string;
        mimetype: string;
        size: bigint;
        width: number | null;
        height: number | null;
        status: FileStatus;
        accessType: FileAccessType;
        uploaderId: bigint | null;
        createdAt: Date;
        updatedAt: Date;
    }): FileEntity {
        return new FileEntity(
            params.id,
            params.bucket,
            params.path,
            params.key,
            params.hash,
            params.filename,
            params.mimetype,
            params.size,
            params.width,
            params.height,
            params.status,
            params.accessType,
            params.uploaderId,
            params.createdAt,
            params.updatedAt,
        );
    }
    updatePath(params: {
        path: string;
        key: string;
        accessType?: FileAccessType;
    }): FileEntity {
        return new FileEntity(
            this.id,
            this.bucket,
            params.path,
            params.key,
            this.hash,
            this.filename,
            this.mimetype,
            this.size,
            this.width,
            this.height,
            this.status,
            params.accessType ?? this.accessType,
            this.uploaderId,
            this.createdAt,
            new Date(),
        );
    }
}

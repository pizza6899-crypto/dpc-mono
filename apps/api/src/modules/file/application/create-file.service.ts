import { Inject, Injectable } from '@nestjs/common';
import * as path from 'path';
import { nanoid } from 'nanoid';
import { Transactional } from '@nestjs-cls/transactional';
import { StorageService } from 'src/infrastructure/storage/storage.service';
import { EnvService } from 'src/common/env/env.service';
import { FileEntity, FileStatus, FileUsageType, FileValidationException, FilePolicy, FileAccessType } from '../domain';
import { FILE_REPOSITORY } from '../ports/file.repository.token';
import { type FileRepositoryPort } from '../ports/file.repository.port';
import { AttachFileService } from './attach-file.service';
import { UserRoleType } from '@repo/database';
import { MessageCode } from '@repo/shared';

interface CreateFileCommand {
    file: Express.Multer.File;
    uploaderId?: bigint;
    uploaderRole?: UserRoleType;
    usageType: FileUsageType;
    usageId?: bigint;
}

@Injectable()
export class CreateFileService {
    constructor(
        @Inject(FILE_REPOSITORY)
        private readonly repository: FileRepositoryPort,
        private readonly storageService: StorageService,
        private readonly envService: EnvService,
        private readonly attachFileService: AttachFileService,
    ) { }

    @Transactional()
    async execute(command: CreateFileCommand): Promise<FileEntity> {
        const { file, uploaderId, uploaderRole, usageType, usageId } = command;

        // 1. Policy Validation (Permissions, Size, MimeType)
        try {
            // Check Config existence
            const config = FilePolicy.getConfig(usageType);

            // Check Permission
            if (uploaderRole && !FilePolicy.canUpload(usageType, uploaderRole)) {
                throw new FileValidationException(
                    `User with role ${uploaderRole} is not authorized to upload files for ${usageType}.`,
                    MessageCode.FILE_POLICY_VIOLATION
                );
            }

            // Check File Specs (Size, Type)
            FilePolicy.validateFile(usageType, file);

        } catch (error) {
            if (error instanceof FileValidationException) throw error;
            throw new FileValidationException(error.message);
        }

        const config = FilePolicy.getConfig(usageType);
        const folder = config.folder;
        const accessType = config.accessType;

        const fileExtension = path.extname(file.originalname);
        const fileName = `${nanoid()}${fileExtension}`;
        const key = `${folder}/${fileName}`;

        // Upload to S3
        await this.storageService.upload(key, file.buffer, file.mimetype);

        const bucket = this.envService.storage.bucket;

        const newFile = FileEntity.create({
            bucket: bucket,
            path: folder,
            key: key,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: BigInt(file.size),
            status: FileStatus.ACTIVE,
            accessType: accessType,
            uploaderId: uploaderId,
        });

        const createdFile = await this.repository.create(newFile);

        if (createdFile.id && usageId) {
            await this.attachFileService.execute({
                fileId: createdFile.id,
                usageType: usageType,
                usageId: usageId,
                order: 0,
            });
        }

        return createdFile;
    }
}

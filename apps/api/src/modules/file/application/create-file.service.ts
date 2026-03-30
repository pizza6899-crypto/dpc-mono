import { Inject, Injectable } from '@nestjs/common';
import * as path from 'path';
import { nanoid } from 'nanoid';
import { StorageService } from 'src/infrastructure/storage/storage.service';
import { EnvService } from 'src/infrastructure/env/env.service';
import {
  FileEntity,
  FileStatus,
  FileValidationException,
  FileAccessType,
  FileConstants,
} from '../domain';
import { FILE_REPOSITORY } from '../ports/file.repository.token';
import { type FileRepositoryPort } from '../ports/file.repository.port';

import { MessageCode } from '@repo/shared';
import sharp from 'sharp';

interface CreateFileCommand {
  file: Express.Multer.File;
  uploaderId?: bigint;
  accessType: FileAccessType;
}

@Injectable()
export class CreateFileService {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly repository: FileRepositoryPort,
    private readonly storageService: StorageService,
    private readonly envService: EnvService,
  ) {}

  async execute(command: CreateFileCommand): Promise<FileEntity> {
    const { file, uploaderId, accessType } = command;

    // Magic Number Validation
    const { fileTypeFromBuffer } = await import('file-type');
    const detectedType = await fileTypeFromBuffer(file.buffer);

    if (!detectedType) {
      throw new FileValidationException(
        'Unable to detect file type.',
        MessageCode.FILE_EXTENSION_NOT_ALLOWED,
      );
    }

    if (
      !FileConstants.ALLOWED_MIME_TYPES.IMAGES.includes(
        detectedType.mime as any,
      )
    ) {
      throw new FileValidationException(
        `Detected file type ${detectedType.mime} is not allowed.`,
        MessageCode.FILE_EXTENSION_NOT_ALLOWED,
      );
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const folder = accessType === FileAccessType.PUBLIC ? 'public' : 'private';

    let fileBuffer = file.buffer;
    let mimeType = detectedType.mime;
    let fileExtension = detectedType.ext;
    let width: number | null = null;
    let height: number | null = null;

    // Image Processing
    if (
      FileConstants.ALLOWED_MIME_TYPES.IMAGE_OPTIMIZABLE.includes(
        detectedType.mime as any,
      )
    ) {
      // Optimizable Images (JPEG, PNG, WebP) -> Convert to WebP + Resize
      const pipeline = sharp(file.buffer)
        .rotate()
        .resize({
          width: 4096,
          height: 4096,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 });

      fileBuffer = await pipeline.toBuffer();

      const metadata = await sharp(fileBuffer).metadata();
      width = metadata.width || null;
      height = metadata.height || null;

      mimeType = 'image/webp';
      fileExtension = 'webp';
    } else if (
      FileConstants.ALLOWED_MIME_TYPES.IMAGES.includes(detectedType.mime as any)
    ) {
      // Other Images (GIF) -> Keep original but extract metadata
      try {
        const metadata = await sharp(file.buffer).metadata();
        width = metadata.width || null;
        height = metadata.height || null;
      } catch (e) {
        // Ignore metadata extraction failure for some formats
      }
    }

    // Path: {accessType}/temp/{yyyy}/{mm}/{nanoid12}.{ext}
    const fileName = `${nanoid(12)}.${fileExtension}`;
    const key = `${folder}/temp/${yyyy}/${mm}/${fileName}`;

    // Upload to S3
    await this.storageService.upload(key, fileBuffer, mimeType);

    const bucket = this.envService.storage.bucket;

    const newFile = FileEntity.create({
      bucket: bucket,
      path: `${folder}/temp/${yyyy}/${mm}`,
      key: key,
      filename: `${path.parse(file.originalname).name}.${fileExtension}`,
      mimetype: mimeType,
      size: BigInt(fileBuffer.length),
      width: width || undefined,
      height: height || undefined,
      status: FileStatus.ACTIVE,
      accessType: accessType,
      uploaderId: uploaderId,
    });

    const createdFile = await this.repository.create(newFile);

    return createdFile;
  }
}

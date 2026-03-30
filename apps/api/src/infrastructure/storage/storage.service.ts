import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { EnvService } from 'src/infrastructure/env/env.service';

@Injectable()
export class StorageService implements OnModuleInit {
  private client: S3Client;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly envService: EnvService) {}

  onModuleInit() {
    const { region, accessKeyId, secretAccessKey, endpoint, forcePathStyle } =
      this.envService.storage;

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      forcePathStyle,
    });
  }

  async upload(
    key: string,
    body: Buffer | Uint8Array | Blob | string | ReadableStream,
    contentType?: string,
  ) {
    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.envService.storage.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        },
      });

      return await upload.done();
    } catch (error) {
      this.logger.error(`S3 Upload Error: ${key}`, error);
      throw error;
    }
  }

  async delete(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.envService.storage.bucket,
        Key: key,
      });

      return await this.client.send(command);
    } catch (error) {
      this.logger.error(`S3 Delete Error: ${key}`, error);
      throw error;
    }
  }

  async copy(sourceKey: string, destinationKey: string) {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.envService.storage.bucket,
        CopySource: `${this.envService.storage.bucket}/${sourceKey}`,
        Key: destinationKey,
      });

      return await this.client.send(command);
    } catch (error) {
      this.logger.error(
        `S3 Copy Error: ${sourceKey} -> ${destinationKey}`,
        error,
      );
      throw error;
    }
  }

  async move(sourceKey: string, destinationKey: string) {
    await this.copy(sourceKey, destinationKey);
    await this.delete(sourceKey);
  }

  async getPresignedUrl(key: string, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.envService.storage.bucket,
        Key: key,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`S3 GetPresignedUrl Error: ${key}`, error);
      throw error;
    }
  }

  getClient(): S3Client {
    return this.client;
  }
}

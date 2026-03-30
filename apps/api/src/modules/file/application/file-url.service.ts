import { Injectable, Inject } from '@nestjs/common';
import { StorageService } from 'src/infrastructure/storage/storage.service';
import { EnvService } from 'src/infrastructure/env/env.service';
import { FileEntity, FileAccessType } from '../domain';
import { FILE_REPOSITORY } from '../ports/file.repository.token';
import type { FileRepositoryPort } from '../ports/file.repository.port';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class FileUrlService {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly fileRepository: FileRepositoryPort,
    private readonly storageService: StorageService,
    private readonly envService: EnvService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 파일의 접근 가능한 URL을 반환합니다. (캐싱 적용)
   * PUBLIC 권한인 경우 CDN URL을, PRIVATE 권한인 경우 S3 Presigned URL을 반환합니다.
   *
   * @param file 파일 엔티티
   * @param expiresIn Presigned URL 만료 시간 (기본 1시간)
   * @returns 파일 접근 URL
   */
  async getUrl(file: FileEntity, expiresIn = 3600): Promise<string | null> {
    if (!file.id) {
      return this.generateUrl(file, expiresIn);
    }

    const cacheConfig =
      file.accessType === FileAccessType.PUBLIC
        ? CACHE_CONFIG.FILE.URL(file.id)
        : CACHE_CONFIG.FILE.PRIVATE_URL(file.id);

    return this.cacheService.getOrSet(cacheConfig, () =>
      this.generateUrl(file, expiresIn),
    );
  }

  /**
   * 실제 URL을 생성하는 내부 로직입니다.
   */
  private async generateUrl(
    file: FileEntity,
    expiresIn: number,
  ): Promise<string | null> {
    if (file.accessType === FileAccessType.PUBLIC) {
      return file.publicUrl(this.envService.app.cdnUrl);
    }

    // PRIVATE 권한인 경우 Presigned URL 생성
    try {
      return await this.storageService.getPresignedUrl(file.key, expiresIn);
    } catch (error) {
      return null;
    }
  }

  /**
   * 여러 파일의 URL을 한껏번에 가져옵니다.
   */
  async getUrls(
    files: FileEntity[],
    expiresIn = 3600,
  ): Promise<(string | null)[]> {
    return Promise.all(files.map((file) => this.getUrl(file, expiresIn)));
  }

  /**
   * 파일 ID 목록을 받아 [ID: URL] 형태의 맵을 반환합니다.
   */
  async getUrlsByFileIds(
    fileIds: bigint[],
    expiresIn = 3600,
  ): Promise<Map<string, string>> {
    if (fileIds.length === 0) return new Map();

    const files = await this.fileRepository.findByIds(fileIds);
    const results = new Map<string, string>();

    await Promise.all(
      files.map(async (file) => {
        const url = await this.getUrl(file, expiresIn);
        if (url && file.id) {
          results.set(file.id.toString(), url);
        }
      }),
    );

    return results;
  }
}

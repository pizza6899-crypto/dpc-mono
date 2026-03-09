import { Injectable } from '@nestjs/common';
import { StorageService } from 'src/infrastructure/storage/storage.service';
import { EnvService } from 'src/common/env/env.service';
import { FileEntity, FileAccessType } from '../domain';

@Injectable()
export class FileUrlService {
    constructor(
        private readonly storageService: StorageService,
        private readonly envService: EnvService,
    ) { }

    /**
     * 파일의 접근 가능한 URL을 반환합니다.
     * PUBLIC 권한인 경우 CDN URL을, PRIVATE 권한인 경우 S3 Presigned URL을 반환합니다.
     * 
     * @param file 파일 엔티티
     * @param expiresIn Presigned URL 만료 시간 (기본 1시간)
     * @returns 파일 접근 URL
     */
    async getUrl(file: FileEntity, expiresIn = 3600): Promise<string | null> {
        if (file.accessType === FileAccessType.PUBLIC) {
            return file.publicUrl(this.envService.app.cdnUrl);
        }

        // PRIVATE 권한인 경우 Presigned URL 생성
        try {
            return await this.storageService.getPresignedUrl(file.key, expiresIn);
        } catch (error) {
            // 로그는 StorageService에서 이미 남김
            return null;
        }
    }

    /**
     * 여러 파일의 URL을 한꺼번에 가져옵니다.
     */
    async getUrls(files: FileEntity[], expiresIn = 3600): Promise<(string | null)[]> {
        return Promise.all(files.map((file) => this.getUrl(file, expiresIn)));
    }
}

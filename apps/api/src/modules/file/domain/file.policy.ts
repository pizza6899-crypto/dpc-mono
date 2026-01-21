import { UserRoleType } from '@prisma/client';
import { MessageCode } from '@repo/shared';
import { FileAccessType } from './model/file.enum';
import { FileUsageType } from './model/file-usage.type';
import { FileValidationException } from './file.exception';

export interface FilePolicyConfig {
    /**
     * 파일 저장 경로 (S3 prefix)
     */
    folder: string;

    /**
     * 파일 접근 권한
     * PUBLIC: 누구나 접근 가능 (CDN)
     * PRIVATE: 인증된 사용자만 접근 가능 (Presigned URL)
     */
    accessType: FileAccessType;

    /**
     * 파일 업로드 가능 권한
     * 지정된 역할 이상만 업로드 가능. 
     * undefined인 경우 모든 인증된 사용자(USER 이상) 업로드 가능.
     */
    uploadRoles?: UserRoleType[];

    /**
     * 파일 최대 크기 (Bytes)
     * 기본값: 5MB
     */
    maxSize?: number;

    /**
     * 허용된 MIME 타입
     * 기본값: 이미지 타입 전체
     */
    allowedMimeTypes?: string[];
}

export class FilePolicy {
    private static readonly DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
    private static readonly DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    private static readonly CONFIG: Record<FileUsageType, FilePolicyConfig> = {
        [FileUsageType.USER_PROFILE]: {
            folder: 'user/profile',
            accessType: FileAccessType.PUBLIC,
            uploadRoles: ['USER', 'ADMIN', 'SUPER_ADMIN'], // User can update their own profile
            maxSize: 2 * 1024 * 1024, // 2MB
        },
        [FileUsageType.CASINO_PROVIDER_LOGO]: {
            folder: 'casino/provider/logo',
            accessType: FileAccessType.PUBLIC,
            uploadRoles: ['ADMIN', 'SUPER_ADMIN'],
        },
        [FileUsageType.CASINO_CATEGORY_ICON]: {
            folder: 'casino/category/icon',
            accessType: FileAccessType.PUBLIC,
            uploadRoles: ['ADMIN', 'SUPER_ADMIN'],
        },
        [FileUsageType.CASINO_CATEGORY_BANNER]: {
            folder: 'casino/category/banner',
            accessType: FileAccessType.PUBLIC,
            uploadRoles: ['ADMIN', 'SUPER_ADMIN'],
        },
    };

    static getConfig(usageType: FileUsageType): FilePolicyConfig {
        const config = this.CONFIG[usageType];
        if (!config) {
            throw new FileValidationException(
                `File Policy not found for usage type: ${usageType}`,
                MessageCode.FILE_POLICY_VIOLATION
            );
        }
        return config;
    }

    static canUpload(usageType: FileUsageType, userRole: UserRoleType): boolean {
        const config = this.getConfig(usageType);
        if (!config.uploadRoles) return true; // No restriction specified means any authenticated user
        return config.uploadRoles.includes(userRole);
    }

    static validateFile(usageType: FileUsageType, file: Express.Multer.File): void {
        const config = this.getConfig(usageType);
        const maxSize = config.maxSize || this.DEFAULT_MAX_SIZE;
        const allowedTypes = config.allowedMimeTypes || this.DEFAULT_ALLOWED_MIME_TYPES;

        if (file.size > maxSize) {
            throw new FileValidationException(
                `File size exceeds limit of ${maxSize} bytes.`,
                MessageCode.FILE_SIZE_EXCEEDED
            );
        }

        if (!allowedTypes.includes(file.mimetype)) {
            throw new FileValidationException(
                `File type ${file.mimetype} is not allowed.`,
                MessageCode.FILE_EXTENSION_NOT_ALLOWED
            );
        }
    }
}

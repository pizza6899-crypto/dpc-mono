import { SqidsPrefix, type SqidsPrefixType } from 'src/common/sqids/sqids.constants';
import { FileAccessType } from './model/file.enum';
import { FileUsageType } from './model/file-usage.type';

export interface FileUsageConfig {
    accessType: FileAccessType;
    sqidsPrefix?: SqidsPrefixType;
}

export const FILE_USAGE_CONFIGS: Record<FileUsageType, FileUsageConfig> = {
    [FileUsageType.USER_PROFILE]: {
        accessType: FileAccessType.PUBLIC,
        sqidsPrefix: SqidsPrefix.USER,
    },
    [FileUsageType.CASINO_PROVIDER_LOGO]: {
        accessType: FileAccessType.PUBLIC,
        // Proivder ID uses BigInt directly without sqids? 
        // Based on previous code, provider methods use direct BigInt ops.
        // Assuming no sqids prefix needed or none defined for Casino Provider yet.
    },
};

export function getFileUsageConfig(type: FileUsageType): FileUsageConfig {
    const config = FILE_USAGE_CONFIGS[type];
    if (!config) {
        // Default configuration if needed, or throw error based on strictness
        // For now returning a safe default
        return {
            accessType: FileAccessType.PRIVATE,
        };
    }
    return config;
}

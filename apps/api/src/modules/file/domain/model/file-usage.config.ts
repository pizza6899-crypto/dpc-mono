import { FileAccessType } from './file.enum';
import { FileUsageType } from './file-usage.type';

export const FileUsageConfig: Record<FileUsageType, { folder: string; accessType: FileAccessType }> = {
    [FileUsageType.USER_PROFILE]: {
        folder: 'user/profile',
        accessType: FileAccessType.PUBLIC,
    },
    // Add other configurations here
};

import {
  SqidsPrefix,
  type SqidsPrefixType,
} from 'src/common/sqids/sqids.constants';
import { FileAccessType } from './model/file.enum';
import { FileUsageType } from './model/file-usage.type';
import { FileValidationException } from './file.exception';
import { MessageCode } from '@repo/shared';

export interface FileUsageConfig {
  accessType: FileAccessType;
  sqidsPrefix?: SqidsPrefixType;
}

export const FILE_USAGE_CONFIGS: Record<FileUsageType, FileUsageConfig> = {
  [FileUsageType.USER_AVATAR]: {
    accessType: FileAccessType.PUBLIC,
    sqidsPrefix: SqidsPrefix.USER,
  },
  [FileUsageType.CASINO_PROVIDER_LOGO]: {
    accessType: FileAccessType.PUBLIC,
  },
  [FileUsageType.CASINO_CATEGORY_ICON]: {
    accessType: FileAccessType.PUBLIC,
  },
  [FileUsageType.CASINO_CATEGORY_BANNER]: {
    accessType: FileAccessType.PUBLIC,
  },
  [FileUsageType.TIER_IMAGE]: {
    accessType: FileAccessType.PUBLIC,
    sqidsPrefix: SqidsPrefix.TIER,
  },
  [FileUsageType.CHAT_MESSAGE]: {
    accessType: FileAccessType.PUBLIC,
    sqidsPrefix: SqidsPrefix.CHAT_MESSAGE,
  },
  [FileUsageType.SUPPORT_CHAT_MESSAGE]: {
    accessType: FileAccessType.PRIVATE,
    sqidsPrefix: SqidsPrefix.CHAT_MESSAGE,
  },
  [FileUsageType.ARTIFACT_CATALOG_IMAGE]: {
    accessType: FileAccessType.PUBLIC,
    sqidsPrefix: SqidsPrefix.ARTIFACT,
  },
};

export function getFileUsageConfig(type: FileUsageType): FileUsageConfig {
  const config = FILE_USAGE_CONFIGS[type];
  if (!config) {
    throw new FileValidationException(
      `File Usage Config not found for usage type: ${type}`,
      MessageCode.FILE_POLICY_VIOLATION,
    );
  }
  return config;
}

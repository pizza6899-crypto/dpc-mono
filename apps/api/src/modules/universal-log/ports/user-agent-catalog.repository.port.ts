import { UserAgentCatalog } from '../domain/user-agent-catalog.entity';

/**
 * [UserAgent] 카탈로그 조회를 위한 Repository Interface (Port)
 */
export abstract class UserAgentCatalogRepositoryPort {
  /**
   * 카탈로그 정보를 DB에 저장하거나 이미 존재하면 기존 ID 반환 (Atomic Upsert)
   */
  abstract upsert(catalog: UserAgentCatalog): Promise<bigint>;

  /**
   * ID로 상세 정보 조회
   */
  abstract findById(id: bigint): Promise<UserAgentCatalog | null>;
}

export const USER_AGENT_CATALOG_REPOSITORY_PORT = Symbol('UserAgentCatalogRepositoryPort');

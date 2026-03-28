import { UserAgentCatalog as PrismaAgent } from '@prisma/client';
import { UserAgentCatalog } from '../domain/user-agent-catalog.entity';

/**
 * [UserAgentCatalog] 도메인 엔티티와 Prisma 데이터 간의 변환기
 */
export class UserAgentCatalogMapper {
  /**
   * Prisma의 저수준 데이터를 도메인 엔티티로 복원
   */
  static toDomain(prismaAgent: PrismaAgent): UserAgentCatalog {
    return UserAgentCatalog.rehydrate({
      id: prismaAgent.id,
      uaHash: prismaAgent.uaHash,
      uaString: prismaAgent.uaString,
      browser: prismaAgent.browser,
      os: prismaAgent.os,
      device: prismaAgent.device,
      createdAt: prismaAgent.createdAt,
    });
  }

  /**
   * 도메인 데이터를 Prisma 레코드로 변환 (보통 Create 시에만 사용)
   */
  static toPersistence(domainAgent: UserAgentCatalog): PrismaAgent {
    return {
      id: domainAgent.id,
      uaHash: domainAgent.uaHash,
      uaString: domainAgent.uaString,
      browser: domainAgent.browser,
      os: domainAgent.os,
      device: domainAgent.device,
      createdAt: domainAgent.createdAt,
    };
  }
}

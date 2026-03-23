import { UserCharacterLog } from '../domain/user-character-log.entity';

/**
 * [Gamification] 캐릭터 성장 및 스탯 변동 이력 로그 리포지토리 포트
 */
export const USER_CHARACTER_LOG_REPOSITORY_PORT = Symbol('USER_CHARACTER_LOG_REPOSITORY_PORT');

export interface UserCharacterLogRepositoryPort {
  /**
   * 새로운 로그를 저장합니다.
   */
  save(log: UserCharacterLog): Promise<void>;

  /**
   * 특정 유저의 로그를 조회합니다.
   */
  findByUserId(userId: bigint, limit?: number, offset?: number): Promise<UserCharacterLog[]>;
}

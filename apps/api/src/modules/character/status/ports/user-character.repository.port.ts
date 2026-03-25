import { UserCharacter } from '../domain/user-character.entity';

/**
 * [Character] 유저 캐릭터 리포지토리 포트
 */
export const USER_CHARACTER_REPOSITORY_PORT = Symbol('USER_CHARACTER_REPOSITORY_PORT');

export interface UserCharacterRepositoryPort {
  /**
   * 특정 유저의 캐릭터 정보를 조회합니다.
   * 유저가 처음 게임에 진입할 때 캐릭터가 없을 수도 있음을 고려하여 null을 반환할 수 있습니다.
   */
  findByUserId(userId: bigint): Promise<UserCharacter | null>;

  /**
   * 유저 캐릭터 정보를 저장(Upsert)합니다.
   */
  save(character: UserCharacter): Promise<void>;
}

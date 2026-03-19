import { UserConfig } from '../../domain/model/user-config.entity';

export interface UserConfigRepositoryPort {
  /**
   * 싱글톤 UserConfig(ID: 1)를 조회합니다.
   */
  findConfig(): Promise<UserConfig | null>;

  /**
   * 설정을 저장(수정)합니다.
   */
  save(userConfig: UserConfig): Promise<void>;
}

import { UniversalLog } from '../domain/universal-log.entity';
import { LogActionKey } from '../domain/types';

/**
 * 범용 로그 인프라를 위한 Repository Interface (Port)
 */
export abstract class UniversalLogRepositoryPort {
  /**
   * 단건 저장
   */
  abstract save<K extends LogActionKey>(log: UniversalLog<K>): Promise<void>;

  /**
   * 대량 저장 (배치)
   */
  abstract saveMany(logs: UniversalLog[]): Promise<void>;

  /**
   * ID로 로그 단건 조회
   */
  abstract findById<K extends LogActionKey = LogActionKey>(id: bigint, createdAt: Date): Promise<UniversalLog<K> | null>;

  // 조회(FindMany) 기능은 추후 어드민 요건에 따라 구체화할 수 있으므로 
  // 여기서는 기본적인 단건 구조만 정의합니다.
}

export const UNIVERSAL_LOG_REPOSITORY_PORT = Symbol('UniversalLogRepositoryPort');

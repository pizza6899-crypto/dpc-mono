import { ForbiddenWord } from '../../domain/model/forbidden-word.entity';
import { AiModerationLog } from '../../domain/model/ai-moderation-log.entity';

export const FORBIDDEN_WORD_REPOSITORY = 'FORBIDDEN_WORD_REPOSITORY';
export const AI_MODERATION_LOG_REPOSITORY = 'AI_MODERATION_LOG_REPOSITORY';

/**
 * 금지어 관리 레포지토리 포트
 */
export interface ForbiddenWordRepositoryPort {
  findAllActive(): Promise<ForbiddenWord[]>;
  findByWord(word: string): Promise<ForbiddenWord | null>;
  findById(id: bigint): Promise<ForbiddenWord | null>;
  exists(word: string): Promise<boolean>;
  saveAll(forbiddenWords: ForbiddenWord[]): Promise<void>;
  findMany(params: {
    skip: number;
    take: number;
    keyword?: string;
    isActive?: boolean;
  }): Promise<ForbiddenWord[]>;
  count(params: { keyword?: string; isActive?: boolean }): Promise<number>;
  update(
    id: bigint,
    data: { description?: string; isActive?: boolean },
  ): Promise<void>;
  delete(id: bigint): Promise<void>;
  create(forbiddenWord: ForbiddenWord): Promise<void>;
}

/**
 * AI 모더레이션 로그 레포지토리 포트
 */
export interface AiModerationLogRepositoryPort {
  /**
   * AI 모더레이션 로그를 저장합니다.
   */
  save(log: AiModerationLog): Promise<void>;
}

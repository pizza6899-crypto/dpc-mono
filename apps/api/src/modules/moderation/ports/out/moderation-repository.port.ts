import { ForbiddenWord } from '../../domain/model/forbidden-word.entity';

export const FORBIDDEN_WORD_REPOSITORY = 'FORBIDDEN_WORD_REPOSITORY';

/**
 * 금지어 관리 레포지토리 포트
 */
export interface ForbiddenWordRepositoryPort {
    findAllActive(): Promise<ForbiddenWord[]>;
    findByWord(word: string): Promise<ForbiddenWord | null>;
    exists(word: string): Promise<boolean>;
}

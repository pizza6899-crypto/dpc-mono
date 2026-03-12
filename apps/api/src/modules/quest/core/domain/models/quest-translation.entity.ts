import { Language } from '@prisma/client';

export interface QuestTranslationProps {
  id: bigint;
  questMasterId: bigint;
  language: Language;
  title: string;
  description: string | null;
}

/**
 * 퀘스트의 다국어 정보를 관리하는 엔티티입니다.
 */
export class QuestTranslation {
  private constructor(private readonly props: QuestTranslationProps) {}

  static fromPersistence(props: QuestTranslationProps): QuestTranslation {
    return new QuestTranslation(props);
  }

  static create(params: {
    language: Language;
    title: string;
    description?: string | null;
  }): QuestTranslation {
    return new QuestTranslation({
      id: 0n,
      questMasterId: 0n,
      language: params.language,
      title: params.title,
      description: params.description ?? null,
    });
  }

  get id(): bigint { return this.props.id; }
  get questMasterId(): bigint { return this.props.questMasterId; }
  get language(): Language { return this.props.language; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
}

import { Prisma } from '@prisma/client';

/**
 * CASL 권한 타입 정의
 *
 * 순수 TypeScript 타입만 사용 (CASL 라이브러리 의존 없음)
 */

/**
 * 리소스 타입 (Subject)
 *
 * Prisma 모델명 리스트를 자동으로 가져와 타입 안정성을 확보합니다.
 * 신규 테이블 추가 시 별도의 수정이 필요 없습니다.
 */
export const SubjectType = Prisma.ModelName;
export type SubjectType = Prisma.ModelName;

/**
 * 액션 타입
 *
 * CASL 표준 액션을 따릅니다.
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // 모든 액션 (CRUD + 기타)
}

/**
 * Subject 타입 (리소스 타입 또는 'all')
 *
 * CASL에서는 'all'을 문자열 리터럴로 사용하여 모든 리소스를 나타냅니다.
 */
export type Subjects = SubjectType | 'all';

/**
 * 권한 정의 인터페이스
 */
export interface Permission {
  action: Action | Action[];
  subject: Subjects;
  conditions?: Record<string, any>; // 조건부 권한 (예: 자신의 리소스만 수정 가능)
}

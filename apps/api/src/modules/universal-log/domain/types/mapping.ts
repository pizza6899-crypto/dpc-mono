import * as Payloads from './payloads';

/**
 * [핵심] 액션 키(서비스.이벤트)와 페이로드 타입의 매핑
 */
export interface LogPayloadMap {
  'artifact.draw': Payloads.ArtifactDrawPayload;
  'artifact.reward': Payloads.ArtifactRewardPayload;
  // 여기에 새로운 액션과 페이로드 타입을 계속 추가합니다.
}

/**
 * 유효한 모든 액션 키 정의
 */
export type LogActionKey = keyof LogPayloadMap;

/**
 * 액션 키에 따른 페이로드 타입을 찾아주는 헬퍼 (엄격하게 매핑된 타입만 허용)
 */
export type PayloadFor<K extends LogActionKey> = LogPayloadMap[K];

import { SetMetadata } from '@nestjs/common';
import { SKIP_TRANSFORM } from '../interceptors/transform.interceptor';

/**
 * TransformInterceptor의 응답 변환을 건너뛰는 데코레이터
 * 게임 업체와의 통신 등 특별한 응답 형식이 필요한 경우 사용
 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM, true);

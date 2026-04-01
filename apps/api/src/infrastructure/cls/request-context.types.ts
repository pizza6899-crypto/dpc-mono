import { ClsStore } from 'nestjs-cls';
import { RequestClientInfo } from '../../common/http/types/client-info.types';
import { AuthenticatedUser } from '../../common/auth/types/auth.types';

/**
 * [RequestContext] CLS 컨텍스트에 저장될 데이터 구조
 */
export interface RequestContextStore extends ClsStore {
  /**
   * 인증된 유저 정보 상세 (AuthenticatedUser)
   */
  user: AuthenticatedUser | null;

  /**
   * 요청 클라이언트 정보 (IP, Geo, Device 등)
   */
  clientInfo: RequestClientInfo | null;
}

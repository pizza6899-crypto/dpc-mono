import { Injectable, Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { RequestContextStore } from './request-context.types';
import { RequestClientInfo } from '../../common/http/types/client-info.types';
import { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import {
  UserRoleType,
  UserStatus,
  Language,
  ExchangeCurrencyCode,
} from '@prisma/client';

/**
 * [RequestContextService]
 * CLS 컨텍스트에서 전역 컨텍스트(ID, Geo, User, Session 등)를 추상화하여 조회하는 서비스입니다.
 */
@Injectable()
export class RequestContextService {
  private readonly logger = new Logger(RequestContextService.name);

  constructor(private readonly cls: ClsService<RequestContextStore>) { }

  /**
   * 고유 트레이스 ID (요청 ID)
   * pino-http의 req.id와 항상 동기화됩니다.
   */
  getTraceId(): string {
    return this.cls.getId() || 'background';
  }

  /**
   * 전체 유저 정보 객체 반환
   */
  getUser(): AuthenticatedUser | null {
    return this.cls.get('user') ?? null;
  }

  /**
   * 유저 닉네임
   */
  getNickname(): string | null {
    return this.getUser()?.nickname ?? null;
  }

  /**
   * 유저 이메일
   */
  getEmail(): string | null {
    return this.getUser()?.email ?? null;
  }

  /**
   * 유저 역할 (Enum)
   */
  getUserRole(): UserRoleType | null {
    return this.getUser()?.role ?? null;
  }

  /**
   * 유저 상태 (Enum)
   */
  getUserStatus(): UserStatus | null {
    return this.getUser()?.status ?? null;
  }

  /**
   * 설정된 기본 언어 (Language)
   */
  getLanguage(): Language | null {
    return this.getUser()?.language ?? null;
  }

  /**
   * 설정된 기본 통화 (ExchangeCurrencyCode)
   */
  getPrimaryCurrency(): ExchangeCurrencyCode | null {
    return this.getUser()?.primaryCurrency ?? null;
  }

  /**
   * 설정된 플레이 통화 (ExchangeCurrencyCode)
   */
  getPlayCurrency(): ExchangeCurrencyCode | null {
    return this.getUser()?.playCurrency ?? null;
  }

  /**
   * 이메일 인증 여부
   */
  isEmailVerified(): boolean {
    return this.getUser()?.isEmailVerified ?? false;
  }

  /**
   * 본인 인증 여부 (Identity Verification)
   */
  isIdentityVerified(): boolean {
    return this.getUser()?.isIdentityVerified ?? false;
  }

  /**
   * 현재 요청의 유저 ID
   */
  getUserId(): bigint | null {
    return this.cls.get('user')?.id ?? null;
  }

  /**
   * 기기 고유 핑거프린트 (IP, UA 등으로 조합된 해시값)
   */
  getDeviceId(): string | null {
    return this.getClientInfo()?.fingerprint ?? null;
  }

  /**
   * 세션 ID
   */
  getSessionId(): string | null {
    return this.getClientInfo()?.sessionId ?? null;
  }

  /**
   * 상세 클라이언트 정보 (Geo, ISP, IP 등)
   */
  getClientInfo(): RequestClientInfo | null {
    return this.cls.get('clientInfo') ?? null;
  }

  /**
   * 실명 IP 주소 (Cloudflare 우선)
   */
  getIpAddress(): string | null {
    return this.getClientInfo()?.ip ?? null;
  }

  /**
   * 국가 코드 (ISO 3166-1 alpha-2)
   */
  getCountryCode(): string | null {
    return this.getClientInfo()?.country ?? null;
  }
}

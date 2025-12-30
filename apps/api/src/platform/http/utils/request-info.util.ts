import type { Request } from 'express';
import type { RequestClientInfo } from '../types/client-info.types';
import { nowUtc } from 'src/utils/date.util';
import { createHash } from 'crypto';

/**
 * Request 객체로부터 RequestClientInfo 추출
 *
 * Cloudflare 헤더를 포함하여 실제 클라이언트 정보를 추출합니다.
 * 데코레이터, Strategy, Exception Filter 등에서 공통으로 사용됩니다.
 */
export function extractClientInfo(request: Request): RequestClientInfo {
  // Cloudflare에서 실제 IP 추출 (우선순위 순)
  const getClientIP = (): string => {
    return (
      (request.headers['cf-connecting-ip'] as string) || // Cloudflare 실제 IP
      request.headers['x-forwarded-for']?.toString().split(',')[0].trim() || // 프록시 체인의 첫 번째 IP
      (request.headers['x-real-ip'] as string) || // Nginx 등에서 사용
      request.ip || // Express trust proxy 후 추출된 IP
      request.connection?.remoteAddress || // 직접 연결 IP
      request.socket?.remoteAddress || // 소켓 IP
      '127.0.0.1' // 기본값
    );
  };

  const userAgent = request.headers['user-agent'] || '';
  const deviceInfo = parseUserAgent(userAgent);

  // CF-Visitor 헤더에서 프로토콜 정보 추출 (JSON 형식)
  const getProtocol = (): string => {
    const cfVisitor = request.headers['cf-visitor'];
    if (cfVisitor) {
      try {
        const visitor = JSON.parse(cfVisitor as string);
        if (visitor.scheme) {
          return visitor.scheme;
        }
      } catch {
        // JSON 파싱 실패 시 기본값 사용
      }
    }
    return request.protocol; // http/https
  };

  return {
    // 기본 정보
    ip: getClientIP(),
    userAgent,
    protocol: getProtocol(),
    method: request.method, // GET/POST/etc
    path: request.path, // 요청 경로
    timestamp: nowUtc(),

    // Cloudflare 추적 정보
    cfRay: request.headers['cf-ray'] as string | undefined,
    cfRequestId: request.headers['cf-request-id'] as string | undefined,
    cfColo: request.headers['cf-ipcolo'] as string | undefined,

    // 지리적 정보
    country: (request.headers['cf-ipcountry'] as string) || 'XX', // Cloudflare 국가 코드 (2자리 ISO 3166-1 Alpha-2)
    countryIso: request.headers['cf-ipcountry-iso'] as string | undefined, // ISO 국가 코드 (3자리 ISO 3166-1 Alpha-3, Enterprise 플랜)
    continent: request.headers['cf-ipcontinent'] as string | undefined, // 대륙 코드 (Enterprise 플랜)
    city: request.headers['cf-ipcity'] as string, // Cloudflare 도시
    region: request.headers['cf-ipregion'] as string | undefined, // 지역/주 (Enterprise 플랜)
    regionCode: request.headers['cf-ipregioncode'] as string | undefined, // 지역 코드 (Enterprise 플랜)
    postalCode: request.headers['cf-ippostalcode'] as string | undefined, // 우편번호 (Enterprise 플랜)
    latitude: request.headers['cf-iplatitude'] as string | undefined, // 위도 (Enterprise 플랜)
    longitude: request.headers['cf-iplongitude'] as string | undefined, // 경도 (Enterprise 플랜)
    timezone: request.headers['cf-timezone'] as string, // Cloudflare 타임존

    // 네트워크 정보
    isp: request.headers['cf-meta-isp'] as string, // ISP 정보
    asn: request.headers['cf-meta-asn'] as string, // ASN 정보
    asNum: request.headers['cf-ipasnum'] as string | undefined, // AS 번호 (CF-IPASNum, Enterprise 플랜)
    asOrg: request.headers['cf-ipasorg'] as string | undefined, // AS 조직명 (CF-IPASOrg, Enterprise 플랜)

    // 보안 정보
    threat: request.headers['cf-threat'] as string, // 위험도 점수
    bot: request.headers['cf-bot-management'] === 'true', // 봇 여부

    // 브라우저 정보
    referer: request.headers['referer'] || '',
    acceptLanguage: request.headers['accept-language'] || '',
    fingerprint: generateFingerprint(request),
    isMobile: deviceInfo.isMobile,
    browser: deviceInfo.browser,
    os: deviceInfo.os,

    // 세션 정보
    sessionId: (request as any).sessionID || undefined, // express-session의 sessionID
  };
}

/**
 * User-Agent 파싱하여 디바이스 정보 추출
 */
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();

  // 모바일 체크
  const isMobile = /mobile|android|iphone|ipad|phone|tablet/.test(ua);

  // 브라우저 감지
  let browser = 'unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  // OS 감지
  let os = 'unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad'))
    os = 'iOS';

  return { isMobile, browser, os };
}

/**
 * 브라우저 핑거프린트 생성
 * 
 * 1. x-device-id 헤더가 있으면 그것을 핑거프린트로 사용
 * 2. 없으면 IP를 제외하고 기기 고유성이 높은 헤더들로 핑거프린트 생성
 */
function generateFingerprint(request: Request): string {
  const h = request.headers;

  // x-device-id 헤더가 있으면 그것을 사용
  const deviceId = h['x-device-id'];
  if (deviceId && typeof deviceId === 'string' && deviceId.trim().length > 0) {
    return deviceId.trim();
  }

  // IP를 제외하고 기기 고유성이 높은 헤더들만 추출
  const coreComponents = {
    ua: h['user-agent'],
    lang: h['accept-language'],
    // Client Hints: 최신 크롬/엣지 등에서 상세 기기 정보를 제공함
    model: h['sec-ch-ua-model'],
    platform: h['sec-ch-ua-platform'],
    arch: h['sec-ch-ua-arch'],
    bitness: h['sec-ch-ua-bitness'],
  };

  const seed = Object.values(coreComponents).filter(Boolean).join('|');

  // 값이 없으면 unknown 반환
  if (!seed || seed.length === 0) {
    return 'unknown';
  }

  // SHA-256을 사용하여 충돌 방지 및 고유성 강화
  return createHash('sha256').update(seed).digest('hex').slice(0, 20);
}

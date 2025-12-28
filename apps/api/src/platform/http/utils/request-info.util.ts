import type { Request } from 'express';
import type { RequestClientInfo } from '../types/client-info.types';
import { nowUtc } from 'src/utils/date.util';

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

  return {
    ip: getClientIP(),
    userAgent,
    country: (request.headers['cf-ipcountry'] as string) || 'XX', // Cloudflare 국가 코드
    city: request.headers['cf-ipcity'] as string, // Cloudflare 도시
    referer: request.headers['referer'] || '',
    acceptLanguage: request.headers['accept-language'] || '',
    fingerprint: generateFingerprint(request),
    protocol: request.protocol, // http/https
    method: request.method, // GET/POST/etc
    path: request.path, // 요청 경로
    timestamp: nowUtc(),
    isMobile: deviceInfo.isMobile,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    timezone: request.headers['cf-timezone'] as string, // Cloudflare 타임존
    isp: request.headers['cf-meta-isp'] as string, // ISP 정보
    asn: request.headers['cf-meta-asn'] as string, // ASN 정보
    threat: request.headers['cf-threat'] as string, // 위험도 점수
    bot: request.headers['cf-bot-management'] === 'true', // 봇 여부
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
 */
function generateFingerprint(request: Request): string {
  const components = [
    request.headers['cf-connecting-ip'] || request.ip,
    request.headers['user-agent'],
    request.headers['accept-language'],
    request.headers['accept-encoding'],
    request.headers['accept'],
    request.headers['dnt'], // Do Not Track
    request.headers['sec-ch-ua'], // Client Hints
    request.headers['sec-ch-ua-platform'],
  ].filter(Boolean);

  if (components.length === 0) return 'unknown';

  // 더 안전한 해시 생성
  const combined = components.join('|');
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) + hash + combined.charCodeAt(i);
  }

  return Math.abs(hash).toString(36);
}

/**
 * 클라이언트 요청 정보
 *
 * Cloudflare 헤더를 포함하여 추출한 클라이언트 정보입니다.
 */
export interface RequestClientInfo {
  // 기본 정보
  ip: string;
  userAgent: string;
  protocol: string;
  method: string;
  path: string;
  timestamp: Date;

  // Cloudflare 추적 정보
  /** Cloudflare 요청 추적 ID (CF-Ray) */
  cfRay?: string;
  /** Cloudflare 요청 고유 ID (CF-Request-ID) */
  cfRequestId?: string;
  /** Cloudflare 데이터센터 코드 (CF-IPColo) */
  cfColo?: string;

  // 지리적 정보
  /** 국가 코드 (CF-IPCountry) */
  country: string;
  /** ISO 국가 코드 (CF-IPCountry-ISO) */
  countryIso?: string;
  /** 대륙 (CF-IPContinent) */
  continent?: string;
  /** 도시 (CF-IPCity) */
  city: string;
  /** 지역/주 (CF-IPRegion) */
  region?: string;
  /** 지역 코드 (CF-IPRegionCode) */
  regionCode?: string;
  /** 우편번호 (CF-IPPostalCode) */
  postalCode?: string;
  /** 위도 (CF-IPLatitude) */
  latitude?: string;
  /** 경도 (CF-IPLongitude) */
  longitude?: string;
  /** 타임존 (CF-Timezone) */
  timezone: string;

  // 네트워크 정보
  /** ISP 정보 (CF-Meta-ISP) */
  isp: string;
  /** ASN 정보 (CF-Meta-ASN) */
  asn: string;
  /** AS 번호 (CF-IPASNum) */
  asNum?: string;
  /** AS 조직명 (CF-IPASOrg) */
  asOrg?: string;

  // 보안 정보
  /** 위험도 점수 (CF-Threat) */
  threat: string;
  /** 봇 여부 (CF-Bot-Management) */
  bot: boolean;

  // 브라우저 정보
  referer: string;
  acceptLanguage: string;
  fingerprint: string;
  isMobile: boolean;
  browser: string;
  os: string;
}

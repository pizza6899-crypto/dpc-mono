export interface RequestClientInfo {
  ip: string;
  userAgent: string;
  country: string;
  city: string;
  referer: string;
  acceptLanguage: string;
  fingerprint: string;
  protocol: string;
  method: string;
  path: string;
  timestamp: Date;
  isMobile: boolean;
  browser: string;
  os: string;
  timezone: string;
  isp: string;
  asn: string;
  threat: string;
  bot: boolean;
}

import helmet from 'helmet';

const isProduction = process.env.NODE_ENV === 'production';

export const helmetConfig = helmet({
  xssFilter: true,
  noSniff: true,
  frameguard: {
    action: 'deny',
  },
  hsts: isProduction
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      scriptSrc: isProduction
        ? ["'self'"] // 운영 환경에서는 인라인 스크립트 철저 차단
        : ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      imgSrc: isProduction
        ? ["'self'", 'data:', 'https:'] // 운영에서는 안전한 이미지 소스만
        : ["'self'", 'data:', 'https://asyncapi.com', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  dnsPrefetchControl: {
    allow: false,
  },
  ieNoOpen: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  crossOriginEmbedderPolicy: false,
});

# ============================================
# Stage 1: 빌드 단계
# ============================================
FROM node:22-slim AS builder

WORKDIR /app

# 패키지 파일 및 Prisma 스키마 복사
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/

# 빌드에 필요한 네이티브 의존성 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 make g++ libc6-dev && \
    npm ci && \
    npm cache clean --force && \
    apt-get purge -y python3 make g++ libc6-dev && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# 소스 코드 복사
COPY . .

# Prisma Client 생성
RUN npx prisma generate

# TypeScript 빌드
RUN npm run build

# 빌드 완료 후 node_modules 삭제 (프로덕션에서 새로 설치)
RUN rm -rf node_modules

# ============================================
# Stage 2: 프로덕션 런타임
# ============================================
FROM node:22-slim AS production

# 시스템 의존성 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    dumb-init ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/man /usr/share/doc

# 비특권 사용자 생성
RUN groupadd -r nodejs && \
    useradd -r -g nodejs -u 1001 nestjs

WORKDIR /app

# 패키지 파일 및 Prisma 스키마 복사
COPY --chown=nestjs:nodejs package*.json ./
COPY --chown=nestjs:nodejs prisma/schema.prisma ./prisma/

# 프로덕션 의존성만 설치
RUN npm ci --only=production && \
    npm cache clean --force

# 빌드된 파일 복사
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist

# Prisma Client 생성 (프로덕션 플랫폼용)
RUN npx prisma generate && \
    find node_modules/.prisma/client -type f \( \
        -name "*.map" -o -name "*.d.ts" -o \
        -name "query_engine-windows*" -o -name "query_engine-darwin*" -o \
        -name "libquery_engine-windows*" -o -name "libquery_engine-darwin*" \
    \) -delete 2>/dev/null || true

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
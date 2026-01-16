FROM pgvector/pgvector:pg16

# 1. 필수 및 추천 패키지 설치
RUN apt-get update && apt-get install -y \
    postgresql-16-partman \
    postgresql-16-repack \
    postgresql-16-cron \
    postgresql-16-postgis-3 \ 
    # pg_wait_sampling 등은 contrib에 포함되어 있거나 추가 패키지 필요
    && rm -rf /var/lib/apt/lists/*
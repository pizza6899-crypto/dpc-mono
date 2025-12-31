import { defineConfig } from 'orval';

export default defineConfig({
  // 1. API 및 React-Query 훅 생성
  api: {
    input: '../../swagger.json', // Swagger 파일 경로 또는 URL
    output: {
      mode: 'tags-split', // 태그별로 파일 분리 (관리 용이)
      target: './src/api/generated/endpoints',
      schemas: './src/api/generated/models',
      client: 'react-query', // Refine과 궁합이 좋은 React-Query 선택
      clean: true, // 생성 전 기존 파일 정리
      prettier: true, // Prettier 포맷팅 적용
      indexFiles: true, // 인덱스 파일 자동 생성
      // mock: true, // MSW 모킹 데이터 생성 여부
      override: {
        mutator: {
          // 공통 Axios 인스턴스 사용 시 설정
          path: './src/api/axios-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useInfinite: false, // 필요시 true로 변경
          useInfiniteQueryParam: 'page',
        },
      },
    },
  },
  // 2. Zod 스키마 전용 생성 (Shadcn Form validation용)
  zod: {
    input: '../../swagger.json', // Swagger 파일 경로 또는 URL
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: './src/api/generated/zod',
      fileExtension: '.zod.ts',
      clean: true, // 생성 전 기존 파일 정리
      prettier: true, // Prettier 포맷팅 적용
    },
  },
});
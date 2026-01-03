import { defineConfig } from 'orval';

export default defineConfig({
    'admin-api': {
        input: {
            // 1. 백엔드 Swagger JSON 주소 (URL 또는 로컬 파일 경로)
            // target: 'http://localhost:3000/api-json',
            target: '../../swagger.json',
        },
        output: {
            mode: 'tags-split',          // API 태그(Controller)별로 파일을 분리해서 생성
            target: './apis/services',   // 생성된 API 함수가 저장될 위치
            schemas: './apis/models',    // 생성된 타입(Interface)이 저장될 위치
            client: 'vue-query',
            httpClient: 'axios',
            clean: true,                 // 생성 시마다 기존 파일 삭제 후 재생성

            // Nuxt 3 및 Axios 커스텀 인스턴스 설정
            override: {
                mutator: {
                    path: './apis/axios-instance.ts', // 인터셉터가 포함된 커스텀 Axios 경로
                    name: 'customInstance',
                },
            },
        },
    },
});
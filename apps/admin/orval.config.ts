import { defineConfig } from 'orval';

export default defineConfig({
    api: {
        input: '../../swagger.json',
        output: {
            target: './app/api/generated/endpoints',
            schemas: './app/api/generated/models',
            mode: 'tags-split',
            client: 'vue-query',
            httpClient: 'axios',
            override: {
                mutator: {
                    path: './app/api/axios.ts', // target 폴더 기준 상대 경로
                    name: 'customInstance',
                },
                vueQuery: {
                    // Nuxt 4 CSR에서는 훅을 사용하는 방식이 중요합니다.
                    useQuery: true,
                    useMutation: true,
                },
            },
        },
    },
});

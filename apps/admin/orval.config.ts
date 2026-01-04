import { defineConfig } from 'orval';

export default defineConfig({
    api: {
        input: '../../swagger.json',
        output: {
            target: './app/api/generated/endpoints',
            schemas: './app/api/generated/models',
            // mode: 'tags-split',
            mode: 'single',
            client: 'vue-query',
            httpClient: 'axios',
            override: {
                // 1. 함수 이름에서 한글 제거 및 영문 operationId 강제
                operationName: (operation, _route, _method) => {
                    // 1순위: operationId에서 한글 제거
                    if (operation.operationId) {
                        return operation.operationId.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
                    }
                    // 2순위: operationId가 없으면 메서드와 경로 조합 (한글 배제)
                    return `${_method}${_route.replace(/[^a-zA-Z0-9]/g, '')}`;
                },
                // 2. 폴더명(Tag)에서 한글 제거 및 포맷팅
                tags: (tags) => {
                    return tags.map(tag => {
                        const cleanTag = tag
                            .replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '') // 한글 제거
                            .replace(/[^a-zA-Z0-9]/g, '-')     // 영문/숫자 외 하이픈
                            .replace(/-+/g, '-')               // 중복 하이픈 제거
                            .replace(/^-|-$/g, '');            // 앞뒤 하이픈 제거

                        return cleanTag || 'default';        // 만약 한글만 있어서 텅 비어버리면 'default'로 명명
                    });
                },
                // 3. 파일 내부의 제목 주석에서도 한글 제거 (선택 사항)
                title: (title) => title.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, ''),
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

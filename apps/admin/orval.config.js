module.exports = {
    'backoffice-api': {
      input: {
        target: '../../swagger.json',
      },
      output: {
        mode: 'tags-split',       // 태그별로 파일 분리 (가독성 UP)
        target: 'src/api/generated',
        schemas: 'src/api/model', // 타입(인터페이스)만 따로 모으는 폴더
        client: 'react-query',    // React Query 훅 생성
        mock: true,               // MSW 모킹 코드 생성 (백엔드 미완성 시 유용)
        override: {
          mutator: {
            path: './src/api/axios-instance.ts', // 위에서 만든 인스턴스 연결
            name: 'customInstance',
          },
        },
      },
    },
  };
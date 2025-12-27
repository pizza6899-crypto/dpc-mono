// 테스트 환경 설정
process.env.NODE_ENV = 'test';

// 글로벌 테스트 타임아웃 설정
jest.setTimeout(30000);

// Redis 연결 실패 시 테스트 건너뛰기
beforeAll(async () => {
  // 테스트 환경 설정
});

afterAll(async () => {
  // 정리 작업
});

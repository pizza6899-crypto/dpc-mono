/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 한 단계 상위 폴더 경로로 설정
const parentDir = path.join(__dirname, '..'); // __dirname의 부모 디렉토리

// 압축 파일 출력 경로 설정 (현재 디렉토리에 output.zip 생성)
const outputPath = path.join(parentDir, 'output.zip');
const output = fs.createWriteStream(outputPath);

// archiver 인스턴스 생성 (압축 포맷: zip, 압축 레벨: 최대)
const archive = archiver('zip', {
  zlib: { level: 9 },
});

// 압축 완료 시 로그 출력
output.on('close', function () {
  console.log(`압축 완료: ${archive.pointer()} 바이트가 작성되었습니다.`);
});

// 경고 및 에러 처리
archive.on('warning', function (err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function (err) {
  throw err;
});

// 아카이브 스트림에 파이핑
archive.pipe(output);

// 제외할 폴더/파일 패턴 설정 (필요에 따라 수정)
const ignorePatterns = [
  '.cursor/**',
  '.git/**',
  '.vscode/**',
  'dist/**',
  'node_modules/**', // 예시: node_modules 폴더 제외
  'prisma/migrations/**',
  // 'scripts/**',
  '.env',
  'ecosystem.config.js',
  'output.zip',
  '**/.DS_Store', // macOS 디렉토리 메타파일
  '**/__MACOSX/**', // macOS 압축 시 생기는 폴더
];

// 한 단계 상위 디렉토리의 모든 파일 및 폴더를 glob 패턴으로 추가하되, ignore 옵션을 적용
archive.glob('**/*', {
  cwd: parentDir, // 한 단계 상위 폴더 기준으로 설정
  dot: true, // 숨김 파일(dotfile)도 포함
  ignore: ignorePatterns,
});

// 압축 시작
archive.finalize();

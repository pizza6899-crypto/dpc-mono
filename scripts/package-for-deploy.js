const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'deploy-package');
// const ZIP_NAME = `output-deploy-${new Date().toISOString().split('T')[0]}.zip`;
const ZIP_NAME = `output-deploy.zip`;

// 제외할 파일/디렉토리 패턴
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  '.next',
  'build',
  '.turbo',
  '.git',
  '.vscode',
  '.idea',
  'coverage',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  '.env',
  '.env.*',
  '*.db',
  '*.db-journal',
  'pnpm-debug.log*',
  'npm-debug.log*',
  'plopfile.js',
  'plop-templates',
];

// 루트 레벨에서만 제외할 패턴 (소스 코드 내부는 포함)
const ROOT_LEVEL_EXCLUDE = ['out'];

console.log('📦 배포 패키지 생성 시작...\n');

// 출력 디렉토리 정리
if (fs.existsSync(OUTPUT_DIR)) {
  console.log('기존 배포 패키지 디렉토리 삭제 중...');
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 1. 루트 파일 복사
console.log('1. 루트 설정 파일 복사 중...');
const rootFiles = ['package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml', 'turbo.json'];
rootFiles.forEach(file => {
  const src = path.join(ROOT_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(OUTPUT_DIR, file));
    console.log(`   ✓ ${file}`);
  }
});

// 2. apps/api 복사 (필요한 파일만)
console.log('\n2. apps/api 복사 중...');
const apiSrc = path.join(ROOT_DIR, 'apps', 'api');
const apiDest = path.join(OUTPUT_DIR, 'apps', 'api');

function copyDir(src, dest, relativePath = '', isRootLevel = false) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const fullRelativePath = path.join(relativePath, entry.name);

    // 루트 레벨에서만 제외하는 패턴 체크
    if (isRootLevel && ROOT_LEVEL_EXCLUDE.includes(entry.name)) {
      continue;
    }



    // 제외 패턴 체크
    const shouldExclude = EXCLUDE_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        // 와일드카드 패턴: 파일명 기준으로만 매칭
        // 특수 문자를 이스케이프하고 *를 .*로 변환
        const escapedPattern = pattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 정규식 특수 문자 이스케이프
          .replace(/\*/g, '.*'); // *를 .*로 변환
        const regex = new RegExp('^' + escapedPattern + '$');
        return regex.test(entry.name);
      }
      // 정확한 패턴 매칭: 파일명 또는 전체 경로
      return entry.name === pattern || fullRelativePath === pattern;
    });

    if (shouldExclude) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, fullRelativePath, false);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(apiSrc, apiDest, 'apps/api', false);
console.log('   ✓ apps/api 복사 완료');


// 3. packages/shared 복사
console.log('\n3. packages/shared 복사 중...');
const sharedSrc = path.join(ROOT_DIR, 'packages', 'shared');
const sharedDest = path.join(OUTPUT_DIR, 'packages', 'shared');
copyDir(sharedSrc, sharedDest, 'packages/shared', false);
console.log('   ✓ packages/shared 복사 완료');

// 4. ZIP 파일 생성
console.log('\n4. ZIP 파일 생성 중...');
const zipPath = path.join(ROOT_DIR, ZIP_NAME);

// 기존 ZIP 파일 삭제
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  // zip 명령어 사용 (macOS/Linux)
  execSync(`cd ${OUTPUT_DIR} && zip -r ${zipPath} . -x "*.DS_Store"`, {
    stdio: 'inherit',
  });
  console.log(`\n✅ 배포 패키지 생성 완료: ${ZIP_NAME}`);
  console.log(`   위치: ${zipPath}`);
  console.log(`   크기: ${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)} MB\n`);
  
  // 배포 가이드 출력
  console.log('📋 EC2 배포 가이드:');
  console.log('   1. ZIP 파일을 EC2에 업로드');
  console.log('   2. unzip api-deploy-*.zip');
  console.log('   3. cd deploy-package');
  console.log('   4. pnpm install');
  console.log('   5. pnpm prisma migrate deploy');
  console.log('   6. pnpm db:generate');
  console.log('   7. pnpm api:build');
  console.log('   8. pnpm api:start:prod\n');
} catch (error) {
  console.error('❌ ZIP 파일 생성 실패:', error.message);
  console.log('\n대안: tar 명령어 사용');
  try {
    execSync(`cd ${OUTPUT_DIR} && tar -czf ${zipPath.replace('.zip', '.tar.gz')} .`, {
      stdio: 'inherit',
    });
    console.log(`✅ TAR.GZ 파일 생성 완료: ${zipPath.replace('.zip', '.tar.gz')}`);
  } catch (tarError) {
    console.error('❌ TAR 파일 생성도 실패:', tarError.message);
    process.exit(1);
  }
}

// 5. 임시 디렉토리 정리
if (fs.existsSync(OUTPUT_DIR)) {
  console.log('🧹 임시 배포 디렉토리 정리 중...');
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}


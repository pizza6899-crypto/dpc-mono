const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'deploy-package');
const ZIP_NAME = `api-deploy-${new Date().toISOString().split('T')[0]}.zip`;

// 제외할 파일/디렉토리 패턴
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  '.next',
  'out',
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
];

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

function copyDir(src, dest, relativePath = '') {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const fullRelativePath = path.join(relativePath, entry.name);

    // 제외 패턴 체크
    const shouldExclude = EXCLUDE_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(entry.name) || regex.test(fullRelativePath);
      }
      return entry.name === pattern || fullRelativePath === pattern;
    });

    if (shouldExclude) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, fullRelativePath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(apiSrc, apiDest, 'apps/api');
console.log('   ✓ apps/api 복사 완료');

// 3. packages/database 복사
console.log('\n3. packages/database 복사 중...');
const dbSrc = path.join(ROOT_DIR, 'packages', 'database');
const dbDest = path.join(OUTPUT_DIR, 'packages', 'database');
copyDir(dbSrc, dbDest, 'packages/database');
console.log('   ✓ packages/database 복사 완료');

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
  console.log('   5. pnpm db:generate');
  console.log('   6. pnpm api:build');
  console.log('   7. pnpm api:start:prod\n');
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


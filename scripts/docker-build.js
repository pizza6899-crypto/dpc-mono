const { execSync } = require('child_process');

const now = new Date();
const tag = now.toISOString().replace(/[-T:Z]/g, '').slice(0, 12);
const imageName = "dpc-api";

try {
  console.log(`🧹 빌드 전 여유 공간 확보 중...`);
  // dangling(태그 없는) 이미지 정리
  execSync('docker image prune -f', { stdio: 'inherit' });

  console.log(`🚀 빌드 시작 (태그: ${tag})...`);
  
  // buildx 명령어 실행
  // env에 DOCKER_BUILDKIT을 명시적으로 넣어주는 것이 안전합니다.
  execSync(`docker buildx build --platform linux/arm64 -f Dockerfile.api -t ${imageName}:${tag} -t ${imageName}:latest --load .`, { 
    stdio: 'inherit',
    env: { ...process.env, DOCKER_BUILDKIT: '1' }
  });
  
  console.log(`🧹 빌드 후 오래된 캐시 정리...`);
  // 24시간 이상 된 빌드 캐시만 정리 (최신 캐시는 다음 빌드를 위해 보존)
  execSync('docker builder prune --filter "until=24h" -f', { stdio: 'inherit' });
  
  console.log(`✅ 빌드 성공: ${imageName}:${tag}`);

} catch (error) {
  console.error(`❌ 빌드 실패: ${error.message}`);
  process.exit(1); // 실패 시 이후 명령어(run 등) 실행 방지
}
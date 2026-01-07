const { execSync } = require('child_process');

// 1. 날짜 태그 생성 (YYYYMMDDHHmm)
const now = new Date();
const tag = now.toISOString().replace(/[-T:Z]/g, '').slice(0, 12);
const imageName = "dpc-api";

try {
  console.log(`🚀 빌드 시작 (태그: ${tag})...`);
  
  // 빌드 명령어 실행
  execSync(`docker buildx build --platform linux/arm64 -f Dockerfile.api -t ${imageName}:${tag} -t ${imageName}:latest --load .`, { 
    stdio: 'inherit', 
    env: {
      ...process.env, 
      DOCKER_BUILDKIT: '1' // 내 컴퓨터 변수는 안 쓰더라도 엔진 설정은 유지
    }
});
  
// execSync('docker system prune -f', { stdio: 'inherit' });
  console.log(`✅ 빌드 성공: ${imageName}:${tag}`);

} catch (error) {
  console.error(`❌ 빌드 실패: ${error.message}`);
}
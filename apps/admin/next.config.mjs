/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",      // CSR 빌드를 위한 정적 내보내기 설정
  trailingSlash: true,   // 각 페이지를 /about/index.html 형태로 생성 (호스팅 호환성 향상)
  images: {
    unoptimized: true,   // 정적 내보내기 시 Next.js 기본 이미지 최적화는 사용할 수 없음
  },
};

export default nextConfig;
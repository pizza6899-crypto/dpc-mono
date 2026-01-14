export class UploadFileResponseDto {
    key: string;
    url: string; // 편의상 URL도 함께 반환 (CDN or Presigned or S3 URL)
}

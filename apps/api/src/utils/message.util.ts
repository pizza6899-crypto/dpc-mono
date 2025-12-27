/**
 * API 응답용 메시지 정제
 * 한글이 포함된 메시지는 빈 문자열로 반환 (API 응답에는 영어만 허용)
 */
export function sanitizeApiMessage(message: string): string {
  if (!message) return '';

  // 한글 문자 체크
  const hasKorean = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(message);

  if (hasKorean) {
    return '';
  }

  return message;
}

/**
 * 메시지에 한글이 포함되어 있는지 확인
 */
export function hasKorean(message: string): boolean {
  if (!message) return false;
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(message);
}

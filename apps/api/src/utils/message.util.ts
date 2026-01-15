/**
 * API 응답용 메시지 정제
 * 한글이 포함된 메시지는 빈 문자열로 반환 (API 응답에는 영어만 허용)
 */
export function sanitizeApiMessage(message: string): string {
  if (!message) return '';

  // "English / Korean" 형식인 경우 앞부분(영어)만 추출 시도
  if (message.includes(' / ')) {
    const parts = message.split(' / ');
    // 첫 번째 파트가 한글이 없다면 반환
    if (parts.length > 0 && !hasKorean(parts[0])) {
      return parts[0].trim();
    }
  }

  // 한글 문자 체크
  if (hasKorean(message)) {
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

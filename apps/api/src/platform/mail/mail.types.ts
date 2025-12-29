import type { EmailType } from '@repo/database';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;

  // EmailLog 저장을 위한 옵션 추가
  userId?: bigint; // 사용자 ID
  emailType: EmailType; // 이메일 타입 (필수)
  metadata?: Record<string, any>; // 추가 메타데이터
}

export interface MailTemplate {
  subject: string;
  html: string;
  text?: string;
}

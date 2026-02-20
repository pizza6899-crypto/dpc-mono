import type { AuditLogOptions } from '../../../../audit-log/infrastructure/audit-log.decorator';
import { LogType } from '../../../../audit-log/domain';

const extractAction = (req: any): string => {
  const url = req.url || '';
  if (url.includes('/balance')) return 'GET_BALANCE';
  if (url.includes('/debit')) return 'DEBIT';
  if (url.includes('/credit')) return 'CREDIT';
  if (url.includes('/bonus')) return 'GET_BONUS';
  return 'UNKNOWN';
};

const sanitizeHeaders = (headers: any) => {
  const sanitized = { ...headers };
  // 민감 정보 제거 (대소문자 구분 없이 처리하려면 소문자로 통일해서 비교해야 하지만, 보통 노드 헤더는 소문자임)
  delete sanitized.authorization;
  delete sanitized['ag-token'];
  delete sanitized['secret-key']; // 추가로 secret-key도 제거
  return sanitized;
};

export const getWhitecliffAuditOptions = (
  actionOverride?: string,
): AuditLogOptions => ({
  type: LogType.INTEGRATION,
  action: actionOverride || 'WHITECLIFF_CALLBACK',
  extractMetadata: (req: any, _args: any[], result: any, error: any) => {
    const action = actionOverride || extractAction(req);
    return {
      provider: 'WHITECLIFF',
      method: req.method,
      endpoint: req.url,
      statusCode: error ? error.status || 500 : 200,
      request: {
        body: req.body,
        headers: sanitizeHeaders(req.headers),
      },
      response: error ? { error: error.message } : result,
      action, // 통합 로그에서는 action 필드가 별도로 있지만, 메타데이터에도 남겨둠
    };
  },
});

import { RequestClientInfo } from '../http/types/client-info.types';
import { ActivityLogData } from './activity-log.types';

export interface ActivityLogPort {
  log(data: ActivityLogData, requestInfo: RequestClientInfo): Promise<void>;
  logSuccess(
    data: Omit<ActivityLogData, 'status'>,
    requestInfo: RequestClientInfo,
  ): Promise<void>;
  logFailure(
    data: Omit<ActivityLogData, 'status'>,
    requestInfo: RequestClientInfo,
  ): Promise<void>;
}

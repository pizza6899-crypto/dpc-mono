// apps/api/src/modules/notification/infrastructure/channels/sms/providers/ncloud.adapter.ts

import { Injectable, Logger } from '@nestjs/common';
import {
    SMSProviderAdapter,
    SMSProviderParams,
    ProviderResult,
} from '../../../../common';

@Injectable()
export class NCloudAdapter implements SMSProviderAdapter {
    private readonly logger = new Logger(NCloudAdapter.name);

    getProviderName(): string {
        return 'NCloud SMS (Mock)';
    }

    async send(params: SMSProviderParams): Promise<ProviderResult> {
        this.logger.log(`[Mock] Sending SMS via NCloud to ${params.to}`);
        this.logger.debug(`Message: ${params.message}`);

        // Mock successful sending
        return {
            success: true,
            messageId: `ncloud-mock-${Date.now()}`,
        };
    }
}

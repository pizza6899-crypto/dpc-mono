// apps/api/src/modules/notification/processor/channels/email/providers/ses.adapter.ts

import { Injectable, Logger } from '@nestjs/common';
import {
    EmailProviderAdapter,
    EmailProviderParams,
    ProviderResult,
} from '../../../../common';

@Injectable()
export class SESAdapter implements EmailProviderAdapter {
    private readonly logger = new Logger(SESAdapter.name);

    getProviderName(): string {
        return 'AWS SES (Mock)';
    }

    async send(params: EmailProviderParams): Promise<ProviderResult> {
        this.logger.log(`[Mock] Sending email via SES to ${params.to}`);
        this.logger.debug(`Subject: ${params.subject}`);
        this.logger.debug(`HTML Body length: ${params.html.length}`);

        // Mock successful sending
        return {
            success: true,
            messageId: `ses-mock-${Date.now()}`,
        };
    }
}

// apps/api/src/modules/notification/infrastructure/channels/sms/sms.sender.ts

import { Injectable } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import {
    ChannelSender,
    ChannelSendParams,
    SMSProviderAdapter,
} from '../../../common';
import { NCloudAdapter } from './providers/ncloud.adapter';

@Injectable()
export class SMSSender implements ChannelSender {
    private provider: SMSProviderAdapter;

    constructor(ncloudAdapter: NCloudAdapter) {
        this.provider = ncloudAdapter;
    }

    getChannelType(): ChannelType {
        return ChannelType.SMS;
    }

    async send(params: ChannelSendParams): Promise<void> {
        const phoneNumber = params.target;

        if (!phoneNumber) {
            throw new Error(`Phone number not found for log ${params.logId}`);
        }

        const result = await this.provider.send({
            to: phoneNumber,
            message: params.body,
        });

        if (!result.success) {
            throw new Error(`SMS sending failed: ${result.error}`);
        }
    }
}

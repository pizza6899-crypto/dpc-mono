// apps/api/src/modules/notification/infrastructure/channels/email/email.sender.ts

import { Injectable } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import {
  ChannelSender,
  ChannelSendParams,
  EmailProviderAdapter,
} from '../../../common';
import { NodemailerAdapter } from './providers/nodemailer.adapter';

@Injectable()
export class EmailSender implements ChannelSender {
  private provider: EmailProviderAdapter;

  constructor(nodemailerAdapter: NodemailerAdapter) {
    this.provider = nodemailerAdapter;
  }

  getChannelType(): ChannelType {
    return ChannelType.EMAIL;
  }

  async send(params: ChannelSendParams): Promise<void> {
    const email = params.target;

    if (!email) {
      throw new Error(`Email address not found for log ${params.logId}`);
    }

    const result = await this.provider.send({
      to: email,
      subject: params.title,
      html: params.body,
    });

    if (!result.success) {
      throw new Error(`Email sending failed: ${result.error}`);
    }
  }
}

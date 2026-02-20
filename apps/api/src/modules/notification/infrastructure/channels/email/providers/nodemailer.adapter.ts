import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EnvService } from 'src/common/env/env.service';
import {
  EmailProviderAdapter,
  EmailProviderParams,
  ProviderResult,
} from '../../../../common';

@Injectable()
export class NodemailerAdapter implements EmailProviderAdapter {
  private readonly logger = new Logger(NodemailerAdapter.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly envService: EnvService) {
    const { host, port, secure, auth } = this.envService.smtp;

    if (!host || !auth?.user || !auth?.pass) {
      this.logger.warn(
        'SMTP configuration is missing. NodemailerAdapter might not work.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for other ports
      auth: {
        user: auth?.user,
        pass: auth?.pass,
      },
    });
  }

  getProviderName(): string {
    return 'Nodemailer';
  }

  async send(params: EmailProviderParams): Promise<ProviderResult> {
    if (!this.envService.smtp.enabled) {
      this.logger.log(
        `[Mock] Email sending disabled. Skipping email to ${params.to}`,
      );
      return {
        success: true,
        messageId: `mock-disabled-${Date.now()}`,
      };
    }

    try {
      const { from } = this.envService.smtp;

      const info = await this.transporter.sendMail({
        from: params.from || from || '"No Reply" <noreply@example.com>', // Default sender
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      this.logger.log(`Email sent: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.message,
      };
    }
  }
}

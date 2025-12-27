import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EnvService } from '../env/env.service';
import { SendMailOptions } from './mail.types';
import { PrismaService } from '../prisma/prisma.service';
import { nowUtc } from 'src/utils/date.util';
import { EmailStatus, EmailType } from '@prisma/client';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly envService: EnvService,
    private readonly prisma: PrismaService,
  ) {
    const smtpConfig = this.envService.smtp;

    this.transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
    });
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const smtpConfig = this.envService.smtp;

    if (!smtpConfig.enabled) {
      this.logger.warn('Email sending is disabled. Skipping email send.');
      return;
    }

    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const sentAt = new Date();

    try {
      const mailOptions = {
        from: smtpConfig.from,
        to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(', ')
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(', ')
            : options.bcc
          : undefined,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      // 성공 로그
      this.logger.log(`Email sent successfully: ${info.messageId}`);

      // EmailLog 저장 (성공)
      await this.saveEmailLog({
        userId: options.userId,
        emailType: options.emailType,
        to,
        subject: options.subject,
        from: smtpConfig.from,
        status: EmailStatus.SENT,
        messageId: info.messageId,
        sentAt,
        metadata: options.metadata,
      });
    } catch (error) {
      // 실패 로그
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);

      // EmailLog 저장 (실패)
      await this.saveEmailLog({
        userId: options.userId,
        emailType: options.emailType,
        to,
        subject: options.subject,
        from: smtpConfig.from,
        status: EmailStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
        sentAt,
        metadata: options.metadata,
      });

      throw error;
    }
  }

  /**
   * EmailLog 저장 (내부 메서드)
   */
  private async saveEmailLog(data: {
    userId?: string;
    emailType: EmailType;
    to: string;
    subject: string;
    from?: string;
    status: EmailStatus;
    messageId?: string;
    error?: string;
    sentAt: Date;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.emailLog.create({
        data: {
          userId: data.userId,
          type: data.emailType,
          status: data.status,
          to: data.to,
          subject: data.subject,
          from: data.from,
          messageId: data.messageId,
          error: data.error,
          sentAt: data.sentAt,
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      // EmailLog 저장 실패는 이메일 발송에 영향을 주지 않도록 조용히 처리
      this.logger.error(`Failed to save email log: ${error.message}`);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified');
      return true;
    } catch (error) {
      this.logger.error(`SMTP verification failed: ${error.message}`);
      return false;
    }
  }
}

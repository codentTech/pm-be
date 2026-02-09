import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

/** Simple {{variable}} template compiler - no external deps */
function compileTemplate(source: string, context: Record<string, unknown>): string {
  return source.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = context[key];
    return value !== undefined && value !== null ? String(value) : '';
  });
}

export type EmailTemplate =
  | 'invite-member'
  | 'verify-email'
  | 'verification-code'
  | 'forgot-password';

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: EmailTemplate;
  context: Record<string, unknown>;
}

@Injectable()
export class EmailService {
  private readonly brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';
  private readonly templatesDir = path.join(__dirname, '../../templates');

  constructor(private readonly configService: ConfigService) {}

  private getTemplatePath(template: EmailTemplate): string {
    return path.join(this.templatesDir, `${template}.hbs`);
  }

  private renderTemplate(template: EmailTemplate, context: Record<string, unknown>): string {
    const templatePath = this.getTemplatePath(template);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${template}`);
    }
    const source = fs.readFileSync(templatePath, 'utf-8');
    return compileTemplate(source, context);
  }

  async send(options: SendEmailOptions): Promise<void> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY')?.trim();
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    if (!apiKey) {
      if (nodeEnv === 'production') {
        throw new Error('BREVO_API_KEY is not configured. Email cannot be sent.');
      }
      // In development, skip sending and log instead of failing
      console.warn(
        `[EmailService] BREVO_API_KEY not set. Skipping email to ${options.to} (${options.subject}). ` +
          'Add BREVO_API_KEY to .env to enable email delivery.',
      );
      return;
    }

    const htmlContent = this.renderTemplate(options.template, options.context);

    const senderEmail =
      this.configService.get<string>('SENDER_EMAIL') || 'noreply@example.com';
    const senderName =
      this.configService.get<string>('SENDER_NAME') || 'Trello Clone';

    await axios.post(
      this.brevoApiUrl,
      {
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  async sendInviteMember(params: {
    to: string;
    organizationName: string;
    inviterName: string;
    role: string;
    acceptUrl: string;
  }): Promise<void> {
    await this.send({
      to: params.to,
      subject: `You're invited to join ${params.organizationName}`,
      template: 'invite-member',
      context: {
        organizationName: params.organizationName,
        inviterName: params.inviterName,
        role: params.role,
        acceptUrl: params.acceptUrl,
      },
    });
  }

  async sendVerifyEmail(params: {
    to: string;
    fullName: string;
    verifyUrl: string;
  }): Promise<void> {
    await this.send({
      to: params.to,
      subject: 'Verify your email address',
      template: 'verify-email',
      context: {
        fullName: params.fullName,
        verifyUrl: params.verifyUrl,
      },
    });
  }

  async sendVerificationCode(params: {
    to: string;
    fullName: string;
    code: string;
    expiryMinutes: number;
  }): Promise<void> {
    await this.send({
      to: params.to,
      subject: 'Your verification code',
      template: 'verification-code',
      context: {
        fullName: params.fullName,
        code: params.code,
        expiryMinutes: params.expiryMinutes,
      },
    });
  }

  async sendForgotPassword(params: {
    to: string;
    fullName: string;
    resetUrl: string;
  }): Promise<void> {
    await this.send({
      to: params.to,
      subject: 'Reset your password',
      template: 'forgot-password',
      context: {
        fullName: params.fullName,
        resetUrl: params.resetUrl,
      },
    });
  }
}

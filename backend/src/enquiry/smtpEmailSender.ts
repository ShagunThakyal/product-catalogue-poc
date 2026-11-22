import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailSender, OutgoingEmail } from './enquiryService.js';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

/**
 * SMTP implementation. Locally it points at Mailpit (no account needed); in AWS the same
 * class works against the SES SMTP endpoint, or replace it with an SES SDK sender.
 */
export class SmtpEmailSender implements EmailSender {
  private readonly transport: Transporter;

  constructor(private readonly cfg: SmtpConfig) {
    this.transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    });
  }

  async send(email: OutgoingEmail): Promise<void> {
    await this.transport.sendMail({ from: this.cfg.from, ...email });
  }
}

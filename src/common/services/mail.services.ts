/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { SendHTMLEmail } from '../types';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendHTMLEmail({
    to,
    subject,
    htmlContent,
  }: SendHTMLEmail): Promise<void> {
    await this.mailerService.sendMail({
      to, // Recipient's email
      from: '"Chat Room" <trongkhangtn080320003@gmail.com>',
      subject, // Email subject
      html: htmlContent, // HTML body
    });
  }
}
